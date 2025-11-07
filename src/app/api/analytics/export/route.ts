import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/analytics/export - Export analytics reports
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const body = await request.json()
    const { format, type, dateRange, includeCharts, includeAI, timestamp } = body
    
    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (dateRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Fetch data based on export type
    const exportData = await generateExportData(type, startDate, now, includeCharts, includeAI)
    
    // Generate the export file based on format
    let fileBuffer: Buffer
    let contentType: string
    let fileName: string

    switch (format) {
      case 'pdf':
        fileBuffer = await generatePDFReport(exportData, type)
        contentType = 'application/pdf'
        fileName = `analytics-report-${Date.now()}.pdf`
        break
      case 'excel':
        fileBuffer = await generateExcelReport(exportData, type)
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        fileName = `analytics-report-${Date.now()}.xlsx`
        break
      case 'csv':
        fileBuffer = await generateCSVReport(exportData, type)
        contentType = 'text/csv'
        fileName = `analytics-report-${Date.now()}.csv`
        break
      default:
        throw new Error('Unsupported export format')
    }

    // Return the file as a download
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Error exporting analytics:', error)
    return NextResponse.json(
      { error: 'Failed to export analytics' },
      { status: 500 }
    )
  }
}

async function generateExportData(type: string, startDate: Date, endDate: Date, includeCharts: boolean, includeAI: boolean) {
  const data: any = {
    metadata: {
      type,
      dateRange: { start: startDate, end: endDate },
      generatedAt: new Date(),
      includeCharts,
      includeAI
    }
  }

  // Fetch basic analytics data
  data.projects = await prisma.project.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      tasks: {
        include: {
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      },
      timeEntries: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              hourlyRate: true
            }
          }
        }
      },
      team: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true
        }
      }
    }
  })

  // Calculate summary metrics
  data.summary = {
    totalProjects: data.projects.length,
    completedProjects: data.projects.filter((p: any) => p.status === 'COMPLETED').length,
    totalTasks: data.projects.reduce((sum: number, p: any) => sum + p.tasks.length, 0),
    completedTasks: data.projects.reduce((sum: number, p: any) => 
      sum + p.tasks.filter((t: any) => t.status === 'DONE').length, 0),
    totalHours: data.projects.reduce((sum: number, p: any) => 
      sum + p.timeEntries.reduce((tSum: number, te: any) => tSum + Number(te.hours), 0), 0),
    totalBudget: data.projects.reduce((sum: number, p: any) => sum + Number(p.budget || 0), 0)
  }

  // Add chart data if requested
  if (includeCharts) {
    data.charts = await generateChartData(startDate, endDate)
  }

  // Add AI insights if requested
  if (includeAI) {
    data.aiInsights = await generateAIInsightsData(startDate, endDate)
  }

  return data
}

async function generateChartData(startDate: Date, endDate: Date) {
  // Generate chart data for export
  return {
    projectProgress: await getProjectProgressChartData(startDate, endDate),
    teamPerformance: await getTeamPerformanceChartData(startDate, endDate),
    budgetAnalysis: await getBudgetAnalysisChartData(startDate, endDate),
    timeTracking: await getTimeTrackingChartData(startDate, endDate)
  }
}

async function generateAIInsightsData(startDate: Date, endDate: Date) {
  // Mock AI insights data (would integrate with actual AI service)
  return {
    insights: [
      {
        type: 'warning',
        title: 'Budget Overrun Risk',
        description: 'Project Alpha is 15% over budget and may exceed allocated funds',
        confidence: 0.85,
        actionItems: ['Review budget allocation', 'Optimize resource usage']
      },
      {
        type: 'success',
        title: 'Team Performance',
        description: 'Development team is performing 20% above average',
        confidence: 0.92,
        actionItems: ['Maintain current practices', 'Share best practices with other teams']
      }
    ],
    recommendations: [
      {
        category: 'budget',
        priority: 'high',
        title: 'Implement Budget Monitoring',
        description: 'Set up automated budget alerts to prevent overruns',
        estimatedImpact: 'Reduce budget overruns by 30%',
        implementation: ['Set up budget tracking', 'Configure alerts', 'Train team leads']
      }
    ]
  }
}

async function generatePDFReport(data: any, type: string): Promise<Buffer> {
  // Mock PDF generation - would use a library like puppeteer or jsPDF
  const content = generateReportContent(data, type, 'pdf')
  
  // For now, return a simple text buffer
  // In real implementation, would generate actual PDF
  return Buffer.from(content, 'utf-8')
}

async function generateExcelReport(data: any, type: string): Promise<Buffer> {
  // Mock Excel generation - would use a library like exceljs
  const content = generateReportContent(data, type, 'excel')
  
  // For now, return a simple text buffer
  // In real implementation, would generate actual Excel file
  return Buffer.from(content, 'utf-8')
}

async function generateCSVReport(data: any, type: string): Promise<Buffer> {
  // Generate CSV content
  let csvContent = 'Analytics Report\n\n'
  
  // Add summary data
  csvContent += 'Summary Metrics\n'
  csvContent += 'Metric,Value\n'
  csvContent += `Total Projects,${data.summary.totalProjects}\n`
  csvContent += `Completed Projects,${data.summary.completedProjects}\n`
  csvContent += `Total Tasks,${data.summary.totalTasks}\n`
  csvContent += `Completed Tasks,${data.summary.completedTasks}\n`
  csvContent += `Total Hours,${data.summary.totalHours}\n`
  csvContent += `Total Budget,${data.summary.totalBudget}\n\n`
  
  // Add project data
  csvContent += 'Projects\n'
  csvContent += 'Name,Status,Budget,Tasks,Completed Tasks,Hours Logged\n'
  
  data.projects.forEach((project: any) => {
    const completedTasks = project.tasks.filter((t: any) => t.status === 'DONE').length
    const totalHours = project.timeEntries.reduce((sum: number, te: any) => sum + Number(te.hours), 0)
    
    csvContent += `"${project.name}","${project.status}",${project.budget || 0},${project.tasks.length},${completedTasks},${totalHours}\n`
  })
  
  return Buffer.from(csvContent, 'utf-8')
}

function generateReportContent(data: any, type: string, format: string): string {
  let content = `Analytics Report - ${type.toUpperCase()}\n`
  content += `Generated: ${data.metadata.generatedAt}\n`
  content += `Date Range: ${data.metadata.dateRange.start} to ${data.metadata.dateRange.end}\n\n`
  
  // Add summary
  content += 'SUMMARY METRICS\n'
  content += `Total Projects: ${data.summary.totalProjects}\n`
  content += `Completed Projects: ${data.summary.completedProjects}\n`
  content += `Total Tasks: ${data.summary.totalTasks}\n`
  content += `Completed Tasks: ${data.summary.completedTasks}\n`
  content += `Total Hours: ${data.summary.totalHours}\n`
  content += `Total Budget: $${data.summary.totalBudget}\n\n`
  
  // Add project details based on type
  if (type === 'detailed' || type === 'summary') {
    content += 'PROJECT DETAILS\n'
    data.projects.forEach((project: any) => {
      content += `\nProject: ${project.name}\n`
      content += `Status: ${project.status}\n`
      content += `Budget: $${project.budget || 0}\n`
      content += `Tasks: ${project.tasks.length}\n`
      content += `Team Size: ${project.team.length}\n`
    })
  }
  
  // Add AI insights if included
  if (data.aiInsights) {
    content += '\n\nAI INSIGHTS\n'
    data.aiInsights.insights.forEach((insight: any) => {
      content += `\n${insight.title} (${insight.type})\n`
      content += `${insight.description}\n`
      content += `Confidence: ${Math.round(insight.confidence * 100)}%\n`
    })
  }
  
  return content
}

// Helper functions for chart data
async function getProjectProgressChartData(startDate: Date, endDate: Date) {
  // Mock implementation
  return { labels: ['Week 1', 'Week 2', 'Week 3'], data: [10, 15, 20] }
}

async function getTeamPerformanceChartData(startDate: Date, endDate: Date) {
  // Mock implementation
  return { labels: ['Frontend', 'Backend', 'QA'], data: [85, 90, 88] }
}

async function getBudgetAnalysisChartData(startDate: Date, endDate: Date) {
  // Mock implementation
  return { labels: ['Jan', 'Feb', 'Mar'], planned: [50000, 55000, 60000], actual: [48000, 52000, 58000] }
}

async function getTimeTrackingChartData(startDate: Date, endDate: Date) {
  // Mock implementation
  return { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], data: [8, 7.5, 8.5, 8, 7] }
}
