import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Member, AttendanceRecord, AttendanceSession } from '../types';

export interface PdfGenerationResult {
  blob: Blob;
  dataUrl: string;
  fileName: string;
}

// Convert Blob or image URL to base64 Data URL for jsPDF embedding
async function blobToDataURL(blobOrUrl: Blob | string): Promise<string> {
  if (typeof blobOrUrl === 'string') {
    if (blobOrUrl.startsWith('data:')) return blobOrUrl;
    // Fetch image url to blob
    const res = await fetch(blobOrUrl);
    const blob = await res.blob();
    return blobToDataURL(blob);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blobOrUrl);
  });
}

// Format date into Indonesian locale string: 29 Agustus 2026
export function formatIndonesianDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-');
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    if (year && month && day) {
      const monthIdx = parseInt(month, 10) - 1;
      return `${parseInt(day, 10)} ${monthNames[monthIdx] || month} ${year}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export async function generateAttendancePdf(
  session: AttendanceSession,
  allMembers: Member[],
  records: AttendanceRecord[]
): Promise<PdfGenerationResult> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const dateFormatted = formatIndonesianDate(session.sessionDate);
  const formattedDateFile = session.sessionDate.split('-').reverse().join('-'); // DD-MM-YYYY
  const fileName = `REKAP_ABSENSI_BINTANG_REMAJA_${formattedDateFile}.pdf`;

  // Colors
  const primaryNavy = [15, 23, 42]; // #0F172A
  const accentBlue = [30, 58, 138]; // #1E3A8A
  const textDark = [30, 41, 59]; // #1E293B

  // Draw Header Banner
  doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.rect(0, 0, 210, 28, 'F');

  // Star Icon Accent (Draw vector star)
  doc.setFillColor(252, 211, 77); // Gold
  doc.circle(20, 14, 8, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('BINTANG REMAJA', 34, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('REKAP ABSENSI KEHADIRAN KARANG TARUNA', 34, 18);

  // Session Details Meta Box
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Tanggal Absensi: `, 14, 36);
  doc.setFont('helvetica', 'normal');
  doc.text(`${dateFormatted}`, 44, 36);

  doc.setFont('helvetica', 'bold');
  doc.text(`Waktu Sesi: `, 120, 36);
  doc.setFont('helvetica', 'normal');
  doc.text(`${session.startTime} - ${session.endTime} WIB`, 142, 36);

  // Map Attendance by Member ID
  const recordMap = new Map<string, AttendanceRecord>();
  records.forEach((r) => recordMap.set(r.memberId, r));

  // Prepare table rows and images map
  const tableData: (string | number)[][] = [];
  const imageMap = new Map<number, string>(); // rowIndex -> dataUrl

  let totalHadir = 0;
  let totalTerlambat = 0;
  let totalTidakHadir = 0;

  for (let i = 0; i < allMembers.length; i++) {
    const member = allMembers[i];
    const rec = recordMap.get(member.id);

    let statusText = 'TIDAK HADIR';
    let jamText = '-';

    if (rec) {
      statusText = rec.status;
      jamText = rec.time;
      if (rec.status === 'HADIR') totalHadir++;
      else if (rec.status === 'TERLAMBAT') totalTerlambat++;

      if (rec.photoBlob) {
        try {
          const imgData = await blobToDataURL(rec.photoBlob);
          imageMap.set(i, imgData);
        } catch (e) {
          console.warn('Failed to convert blob photo for pdf:', e);
        }
      }
    } else {
      totalTidakHadir++;
    }

    tableData.push([
      i + 1,
      member.name,
      jamText,
      statusText,
      '' // Placeholder for image
    ]);
  }

  // Generate Table using AutoTable
  autoTable(doc, {
    startY: 42,
    head: [['No', 'Nama Anggota', 'Waktu', 'Status', 'Foto']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 32, halign: 'center' },
      4: { cellWidth: 30, halign: 'center' },
    },
    didDrawCell: (data) => {
      // Draw image in column 4 for body rows
      if (data.section === 'body' && data.column.index === 4) {
        const rowIndex = data.row.index;
        const imgData = imageMap.get(rowIndex);
        if (imgData) {
          const cell = data.cell;
          const dim = 10; // 10mm x 10mm thumbnail
          const x = cell.x + (cell.width - dim) / 2;
          const y = cell.y + (cell.height - dim) / 2;
          try {
            doc.addImage(imgData, 'JPEG', x, y, dim, dim);
          } catch {
            // ignore image draw errors
          }
        }
      }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const status = data.cell.raw as string;
        if (status === 'HADIR') {
          data.cell.styles.textColor = [16, 185, 129]; // emerald green
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'TERLAMBAT') {
          data.cell.styles.textColor = [245, 158, 11]; // amber yellow
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [239, 68, 68]; // red
          data.cell.styles.fontStyle = 'normal';
        }
      }
    },
  });

  // Calculate stats
  const totalMembers = allMembers.length;
  const attendedCount = totalHadir + totalTerlambat;
  const percentage = totalMembers > 0 ? Math.round((attendedCount / totalMembers) * 100) : 0;

  // Position after table
  // @ts-expect-error autoTable attaches lastAutoTable property
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 220;

  // Render Stats Box
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(14, finalY, 182, 30, 3, 3, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('RINGKASAN REKAPITULASI:', 18, finalY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Total Anggota : ${totalMembers} orang`, 18, finalY + 14);
  doc.text(`Hadir (Tepat Waktu): ${totalHadir} orang`, 18, finalY + 20);
  doc.text(`Terlambat : ${totalTerlambat} orang`, 18, finalY + 26);

  doc.text(`Tidak Hadir : ${totalTidakHadir} orang`, 110, finalY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text(`Persentase Kehadiran : ${percentage}%`, 110, finalY + 22);

  // Footer Sign / Stamp line
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text(`Dokumen ini dibuat otomatis oleh Sistem Absensi Bintang Remaja pada ${new Date().toLocaleString('id-ID')}`, 14, 285);

  const pdfArrayBuffer = doc.output('arraybuffer');
  const blob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
  const dataUrl = doc.output('datauristring');

  return { blob, dataUrl, fileName };
}

// Generate Individual Attendance Proof PDF Card
export async function generateSingleAttendanceReceiptPdf(
  record: AttendanceRecord
): Promise<PdfGenerationResult> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [105, 148] }); // A6 size badge
  const fileName = `BUKTI_ABSENSI_${record.name.toUpperCase().replace(/\s+/g, '_')}_${record.date.replace(/\//g, '-')}.pdf`;

  // Header Box
  doc.setFillColor(30, 58, 138); // Navy
  doc.rect(0, 0, 105, 22, 'F');

  doc.setFillColor(252, 211, 77); // Gold
  doc.circle(12, 11, 5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('BUKTI ABSENSI DIGITAL', 22, 10);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Karang Taruna Bintang Remaja', 22, 16);

  // Content Area
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMASI KEHADIRAN:', 8, 30);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nama Anggota: ${record.name}`, 8, 37);
  doc.text(`Tanggal : ${record.date}`, 8, 43);
  doc.text(`Jam Absensi : ${record.time} WIB`, 8, 49);

  doc.setFont('helvetica', 'bold');
  if (record.status === 'HADIR') {
    doc.setTextColor(16, 185, 129);
  } else {
    doc.setTextColor(245, 158, 11);
  }
  doc.text(`Status: ${record.status}`, 8, 55);

  // Embed Photo if available
  if (record.photoBlob) {
    try {
      const imgData = await blobToDataURL(record.photoBlob);
      doc.addImage(imgData, 'JPEG', 8, 62, 45, 45);
    } catch (e) {
      // ignore
    }
  }

  // Stamp Box
  doc.setLineWidth(0.5);
  doc.setDrawColor(30, 58, 138);
  doc.roundedRect(8, 112, 89, 22, 2, 2);

  doc.setTextColor(30, 58, 138);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('VERIFIKASI SISTEM BIOMETRIK VALID ✓', 12, 118);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`ID Dokumen: ${record.id}`, 12, 124);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 12, 129);

  const pdfArrayBuffer = doc.output('arraybuffer');
  const blob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
  const dataUrl = doc.output('datauristring');

  return { blob, dataUrl, fileName };
}

// Share or Download PDF with Android browser compatibility
export async function downloadOrSharePdf(pdfResult: PdfGenerationResult): Promise<'shared' | 'downloaded'> {
  const file = new File([pdfResult.blob], pdfResult.fileName, { type: 'application/pdf' });

  // Try Web Share API if supported
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Rekap Absensi Bintang Remaja',
        text: `File Rekap Absensi Bintang Remaja - ${pdfResult.fileName}`,
      });
      return 'shared';
    } catch (e: any) {
      if (e.name === 'AbortError') return 'shared';
      console.warn('Web Share API failed, falling back to blob download:', e);
    }
  }

  // Fallback: Standard Blob URL Download trigger
  const url = URL.createObjectURL(pdfResult.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = pdfResult.fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);

  return 'downloaded';
}
