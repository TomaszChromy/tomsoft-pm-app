'use client'

import { useState } from 'react'
import { Download, FileText, Table, ChevronDown } from 'lucide-react'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

interface ExportReportsProps {
  data: any
  dateRange: {
    from: Date
    to: Date
  }
}

export function ExportReports({ data, dateRange }: ExportReportsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const exportToPDF = async () => {
    setIsExporting(true)
    try {
      const pdf = new jsPDF()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 20
      let yPosition = margin

      // Title
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Raport Analityczny', margin, yPosition)
      yPosition += 15

      // Date range
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      const dateRangeText = `Okres: ${format(dateRange.from, 'dd MMM yyyy', { locale: pl })} - ${format(dateRange.to, 'dd MMM yyyy', { locale: pl })}`
      pdf.text(dateRangeText, margin, yPosition)
      yPosition += 20

      // Overview section
      if (data?.overview) {
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Podsumowanie', margin, yPosition)
        yPosition += 10

        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')
        const overview = [
          `Projekty: ${data.overview.totalProjects}`,
          `Ukończone zadania: ${data.overview.completedTasks}`,
          `Przepracowane godziny: ${data.overview.totalHours}h`,
          `Wykorzystanie budżetu: ${data.overview.budgetUtilization}%`
        ]

        overview.forEach(line => {
          pdf.text(line, margin, yPosition)
          yPosition += 8
        })
        yPosition += 10
      }

      // Project progress section
      if (data?.projectProgress?.length > 0) {
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Postęp Projektów', margin, yPosition)
        yPosition += 10

        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')

        // Table headers
        const headers = ['Projekt', 'Postęp', 'Zadania', 'Budżet', 'Wydane']
        const colWidths = [60, 25, 30, 30, 30]
        let xPosition = margin

        pdf.setFont('helvetica', 'bold')
        headers.forEach((header, index) => {
          pdf.text(header, xPosition, yPosition)
          xPosition += colWidths[index]
        })
        yPosition += 8

        pdf.setFont('helvetica', 'normal')
        data.projectProgress.forEach((project: any) => {
          if (yPosition > 250) {
            pdf.addPage()
            yPosition = margin
          }

          xPosition = margin
          const row = [
            project.name.substring(0, 20),
            `${project.progress}%`,
            `${project.tasksCompleted}/${project.totalTasks}`,
            `$${project.budget.toLocaleString()}`,
            `$${project.spent.toLocaleString()}`
          ]

          row.forEach((cell, index) => {
            pdf.text(cell, xPosition, yPosition)
            xPosition += colWidths[index]
          })
          yPosition += 6
        })
        yPosition += 10
      }

      // Team performance section
      if (data?.teamPerformance?.length > 0) {
        if (yPosition > 200) {
          pdf.addPage()
          yPosition = margin
        }

        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Wydajność Zespołu', margin, yPosition)
        yPosition += 10

        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')

        data.teamPerformance.forEach((member: any) => {
          if (yPosition > 250) {
            pdf.addPage()
            yPosition = margin
          }

          pdf.text(`${member.name}: ${member.tasksCompleted} zadań, ${member.hoursLogged}h`, margin, yPosition)
          yPosition += 6
        })
      }

      // Save PDF
      const fileName = `raport-analityczny-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Błąd podczas eksportu do PDF')
    } finally {
      setIsExporting(false)
      setIsOpen(false)
    }
  }

  const exportToExcel = async () => {
    setIsExporting(true)
    try {
      const workbook = XLSX.utils.book_new()

      // Overview sheet
      if (data?.overview) {
        const overviewData = [
          ['Metryka', 'Wartość'],
          ['Projekty', data.overview.totalProjects],
          ['Ukończone zadania', data.overview.completedTasks],
          ['Przepracowane godziny', data.overview.totalHours],
          ['Wykorzystanie budżetu (%)', data.overview.budgetUtilization]
        ]
        const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData)
        XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Podsumowanie')
      }

      // Project progress sheet
      if (data?.projectProgress?.length > 0) {
        const projectData = [
          ['Projekt', 'Postęp (%)', 'Ukończone zadania', 'Wszystkie zadania', 'Budżet', 'Wydane', 'Wykorzystanie (%)'],
          ...data.projectProgress.map((project: any) => [
            project.name,
            project.progress,
            project.tasksCompleted,
            project.totalTasks,
            project.budget,
            project.spent,
            project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0
          ])
        ]
        const projectSheet = XLSX.utils.aoa_to_sheet(projectData)
        XLSX.utils.book_append_sheet(workbook, projectSheet, 'Postęp Projektów')
      }

      // Team performance sheet
      if (data?.teamPerformance?.length > 0) {
        const teamData = [
          ['Członek zespołu', 'Ukończone zadania', 'Przepracowane godziny', 'Wydajność (%)'],
          ...data.teamPerformance.map((member: any) => [
            member.name,
            member.tasksCompleted,
            member.hoursLogged,
            member.efficiency
          ])
        ]
        const teamSheet = XLSX.utils.aoa_to_sheet(teamData)
        XLSX.utils.book_append_sheet(workbook, teamSheet, 'Wydajność Zespołu')
      }

      // Time tracking sheet
      if (data?.timeTracking?.length > 0) {
        const timeData = [
          ['Data', 'Godziny', 'Projekt', 'Użytkownik'],
          ...data.timeTracking.map((entry: any) => [
            entry.date,
            entry.hours,
            entry.project,
            entry.user
          ])
        ]
        const timeSheet = XLSX.utils.aoa_to_sheet(timeData)
        XLSX.utils.book_append_sheet(workbook, timeSheet, 'Śledzenie Czasu')
      }

      // Budget analysis sheet
      if (data?.budgetAnalysis?.length > 0) {
        const budgetData = [
          ['Projekt', 'Budżet', 'Wydane', 'Pozostało', 'Wykorzystanie (%)'],
          ...data.budgetAnalysis.map((item: any) => [
            item.project,
            item.budget,
            item.spent,
            item.remaining,
            item.utilization
          ])
        ]
        const budgetSheet = XLSX.utils.aoa_to_sheet(budgetData)
        XLSX.utils.book_append_sheet(workbook, budgetSheet, 'Analiza Budżetu')
      }

      // Save Excel file
      const fileName = `raport-analityczny-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
      XLSX.writeFile(workbook, fileName)
    } catch (error) {
      console.error('Error exporting Excel:', error)
      alert('Błąd podczas eksportu do Excel')
    } finally {
      setIsExporting(false)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download className="w-4 h-4" />
        <span className="text-sm font-medium">
          {isExporting ? 'Eksportowanie...' : 'Eksportuj'}
        </span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-2">
            <button
              onClick={exportToPDF}
              disabled={isExporting}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              Eksportuj do PDF
            </button>
            <button
              onClick={exportToExcel}
              disabled={isExporting}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <Table className="w-4 h-4" />
              Eksportuj do Excel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
