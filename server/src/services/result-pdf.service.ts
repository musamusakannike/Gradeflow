import PDFDocument from "pdfkit";
import { ResultSummary } from "../types";

export const generateReportCardPdf = (
  result: ResultSummary,
  schoolName: string,
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text(schoolName, { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(16).text("Student Report Card", { align: "center" });
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Student: ${result.student.name}`);
    doc.text(`Student ID: ${result.student.studentId}`);
    doc.text(`Class: ${result.class.name}`);
    doc.text(`Term: ${result.term.name}`);
    doc.moveDown();

    const startX = doc.x;
    let y = doc.y;
    const columns = [
      { label: "Subject", width: 130 },
      { label: "T1", width: 40 },
      { label: "T2", width: 40 },
      { label: "Exam", width: 50 },
      { label: "Total", width: 50 },
      { label: "Grade", width: 50 },
      { label: "Remark", width: 90 },
    ];

    const drawRow = (values: string[], bold = false) => {
      let x = startX;
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
      values.forEach((value, index) => {
        doc.text(value, x, y, {
          width: columns[index].width,
          continued: false,
        });
        x += columns[index].width;
      });
      y += 22;
      doc.moveTo(startX, y - 6).lineTo(545, y - 6).strokeColor("#dddddd").stroke();
    };

    drawRow(columns.map((column) => column.label), true);

    result.subjects.forEach((subject) => {
      if (y > 720) {
        doc.addPage();
        y = 48;
        drawRow(columns.map((column) => column.label), true);
      }

      drawRow([
        subject.name,
        String(subject.test1),
        String(subject.test2),
        String(subject.exam),
        String(subject.total),
        subject.grade,
        subject.remark,
      ]);
    });

    doc.moveDown(2);
    doc.y = y + 12;
    doc.font("Helvetica-Bold").fontSize(11).text("Summary");
    doc.font("Helvetica").fontSize(10);
    doc.text(`Total Subjects: ${result.summary.totalSubjects}`);
    doc.text(`Total Score: ${result.summary.totalScore}`);
    doc.text(`Average Score: ${result.summary.averageScore}`);
    if (result.summary.position && result.summary.classSize) {
      doc.text(`Position: ${result.summary.position} of ${result.summary.classSize}`);
    }

    doc.end();
  });
};
