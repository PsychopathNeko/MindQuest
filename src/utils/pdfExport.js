/**
 * PDF export utility for MindQuest reports (H5 only).
 * Uses dynamic imports to avoid bundling html2canvas/jsPDF in the main chunk.
 */
export async function exportReportPdf(selector, filename) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  const element = document.querySelector(selector)
    || document.getElementById(selector.replace('#', ''))
  if (!element) throw new Error('Element not found: ' + selector)

  // Hide no-print elements
  const noPrintEls = element.querySelectorAll('.no-print')
  noPrintEls.forEach((el) => (el.style.display = 'none'))

  // Force light mode for PDF output
  const pageEl = document.querySelector('.page-report')
  const wasDark = pageEl && pageEl.classList.contains('dark')
  if (wasDark && pageEl) {
    pageEl.classList.remove('dark')
  }

  try {
    // Wait for styles to apply
    await new Promise((r) => setTimeout(r, 100))

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const imgWidth = pdfWidth - margin * 2
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = margin

    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
    heightLeft -= pdfHeight - margin * 2

    while (heightLeft > 0) {
      position = -(imgHeight - heightLeft - margin)
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight - margin * 2
    }

    pdf.save(filename || 'MindQuest_Report.pdf')
  } finally {
    // Restore hidden elements
    noPrintEls.forEach((el) => (el.style.display = ''))
    // Restore dark mode if it was active
    if (wasDark && pageEl) {
      pageEl.classList.add('dark')
    }
  }
}
