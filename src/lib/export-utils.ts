import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export interface ExportData {
  title: string
  subtitle?: string
  data: any[]
  columns: ExportColumn[]
  summary?: Record<string, any>
}

export interface ExportColumn {
  key: string
  title: string
  width?: number
  format?: 'text' | 'number' | 'currency' | 'date' | 'percentage'
}

export class ExportUtils {
  static exportToPDF(exportData: ExportData): void {
    const doc = new jsPDF()
    
    // Title
    doc.setFontSize(20)
    doc.text(exportData.title, 20, 20)
    
    // Subtitle
    if (exportData.subtitle) {
      doc.setFontSize(12)
      doc.text(exportData.subtitle, 20, 30)
    }
    
    // Generated date
    doc.setFontSize(10)
    doc.text(`Wygenerowano: ${new Date().toLocaleDateString('pl-PL')}`, 20, exportData.subtitle ? 40 : 30)
    
    // Table
    const tableData = exportData.data.map(row => 
      exportData.columns.map(col => this.formatValue(row[col.key], col.format))
    )
    
    autoTable(doc, {
      head: [exportData.columns.map(col => col.title)],
      body: tableData,
      startY: exportData.subtitle ? 50 : 40,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Light gray
      },
      columnStyles: this.getColumnStyles(exportData.columns)
    })
    
    // Summary
    if (exportData.summary) {
      const finalY = (doc as any).lastAutoTable.finalY || 50
      doc.setFontSize(12)
      doc.text('Podsumowanie:', 20, finalY + 20)
      
      let yPos = finalY + 30
      Object.entries(exportData.summary).forEach(([key, value]) => {
        doc.setFontSize(10)
        doc.text(`${key}: ${value}`, 20, yPos)
        yPos += 10
      })
    }
    
    // Save
    doc.save(`${exportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`)
  }
  
  static exportToExcel(exportData: ExportData): void {
    const workbook = XLSX.utils.book_new()
    
    // Main data sheet
    const worksheetData = [
      exportData.columns.map(col => col.title),
      ...exportData.data.map(row => 
        exportData.columns.map(col => this.formatValue(row[col.key], col.format))
      )
    ]
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    
    // Set column widths
    const colWidths = exportData.columns.map(col => ({
      wch: col.width || 15
    }))
    worksheet['!cols'] = colWidths
    
    // Style header row
    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
      if (!worksheet[cellAddress]) continue
      
      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "3B82F6" } },
        color: { rgb: "FFFFFF" }
      }
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dane')
    
    // Summary sheet
    if (exportData.summary) {
      const summaryData = [
        ['Klucz', 'Wartość'],
        ...Object.entries(exportData.summary).map(([key, value]) => [key, value])
      ]
      
      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Podsumowanie')
    }
    
    // Save
    XLSX.writeFile(workbook, `${exportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }
  
  private static formatValue(value: any, format?: string): string {
    if (value === null || value === undefined) return ''
    
    switch (format) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString('pl-PL') : value.toString()
      
      case 'currency':
        return typeof value === 'number' 
          ? value.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })
          : value.toString()
      
      case 'date':
        return value instanceof Date 
          ? value.toLocaleDateString('pl-PL')
          : new Date(value).toLocaleDateString('pl-PL')
      
      case 'percentage':
        return typeof value === 'number' 
          ? `${value.toFixed(1)}%`
          : value.toString()
      
      default:
        return value.toString()
    }
  }
  
  private static getColumnStyles(columns: ExportColumn[]): Record<number, any> {
    const styles: Record<number, any> = {}
    
    columns.forEach((col, index) => {
      switch (col.format) {
        case 'number':
        case 'currency':
        case 'percentage':
          styles[index] = { halign: 'right' }
          break
        case 'date':
          styles[index] = { halign: 'center' }
          break
        default:
          styles[index] = { halign: 'left' }
      }
    })
    
    return styles
  }
}

// Predefined export configurations
export const EXPORT_CONFIGS = {
  PROJECT_SUMMARY: {
    title: 'Podsumowanie Projektów',
    columns: [
      { key: 'name', title: 'Nazwa Projektu', width: 25 },
      { key: 'status', title: 'Status', width: 15 },
      { key: 'owner', title: 'Właściciel', width: 20 },
      { key: 'progress', title: 'Postęp', format: 'percentage' as const, width: 12 },
      { key: 'tasks.total', title: 'Zadania', format: 'number' as const, width: 10 },
      { key: 'tasks.completionRate', title: 'Ukończone', format: 'percentage' as const, width: 12 },
      { key: 'timeTracking.totalHours', title: 'Godziny', format: 'number' as const, width: 12 },
      { key: 'timeTracking.totalEarnings', title: 'Przychody', format: 'currency' as const, width: 15 }
    ]
  },
  
  TIME_TRACKING: {
    title: 'Raport Czasu Pracy',
    columns: [
      { key: 'date', title: 'Data', format: 'date' as const, width: 12 },
      { key: 'user', title: 'Użytkownik', width: 20 },
      { key: 'project', title: 'Projekt', width: 20 },
      { key: 'task', title: 'Zadanie', width: 25 },
      { key: 'description', title: 'Opis', width: 30 },
      { key: 'hours', title: 'Godziny', format: 'number' as const, width: 10 },
      { key: 'billable', title: 'Rozliczalne', width: 12 },
      { key: 'hourlyRate', title: 'Stawka', format: 'currency' as const, width: 12 }
    ]
  },
  
  SPRINT_ANALYSIS: {
    title: 'Analiza Sprintów',
    columns: [
      { key: 'sprintName', title: 'Sprint', width: 20 },
      { key: 'projectName', title: 'Projekt', width: 20 },
      { key: 'startDate', title: 'Data Start', format: 'date' as const, width: 12 },
      { key: 'endDate', title: 'Data Koniec', format: 'date' as const, width: 12 },
      { key: 'duration', title: 'Dni', format: 'number' as const, width: 8 },
      { key: 'completedStoryPoints', title: 'SP Ukończone', format: 'number' as const, width: 12 },
      { key: 'totalTasks', title: 'Zadania', format: 'number' as const, width: 10 },
      { key: 'velocity', title: 'Velocity', format: 'number' as const, width: 12 }
    ]
  },
  
  TEAM_PERFORMANCE: {
    title: 'Wydajność Zespołu',
    columns: [
      { key: 'name', title: 'Członek Zespołu', width: 25 },
      { key: 'totalStoryPoints', title: 'Story Points', format: 'number' as const, width: 15 },
      { key: 'totalTasks', title: 'Zadania', format: 'number' as const, width: 12 },
      { key: 'sprintsParticipated', title: 'Sprinty', format: 'number' as const, width: 12 },
      { key: 'averageVelocity', title: 'Śr. Velocity', format: 'number' as const, width: 15 }
    ]
  }
}

// Helper function to get nested object values
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// Transform data for export (handle nested properties)
export function transformDataForExport(data: any[], columns: ExportColumn[]): any[] {
  return data.map(item => {
    const transformedItem: any = {}
    columns.forEach(col => {
      transformedItem[col.key] = getNestedValue(item, col.key)
    })
    return transformedItem
  })
}
