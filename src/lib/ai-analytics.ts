import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export interface ProjectData {
  id: string
  name: string
  status: string
  progress: number
  budget: number
  spent: number
  deadline: string
  tasksCompleted: number
  totalTasks: number
  teamSize: number
  startDate: string
}

export interface TaskData {
  id: string
  title: string
  status: string
  priority: string
  estimatedHours: number
  actualHours: number
  assignedTo: string
  createdAt: string
  completedAt?: string
}

export interface TeamMemberData {
  id: string
  name: string
  role: string
  tasksCompleted: number
  hoursLogged: number
  efficiency: number
  workload: number
}

export interface AIInsight {
  type: 'warning' | 'success' | 'info' | 'prediction'
  title: string
  description: string
  confidence: number
  actionItems?: string[]
  impact: 'low' | 'medium' | 'high'
}

export interface AIRecommendation {
  category: 'budget' | 'timeline' | 'team' | 'quality' | 'risk'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  estimatedImpact: string
  implementation: string[]
}

export interface PredictiveAnalysis {
  projectCompletion: {
    estimatedDate: string
    confidence: number
    factors: string[]
  }
  budgetForecast: {
    estimatedTotal: number
    overrunRisk: number
    recommendations: string[]
  }
  teamPerformance: {
    burnoutRisk: number
    productivityTrend: 'increasing' | 'decreasing' | 'stable'
    recommendations: string[]
  }
}

export class AIAnalyticsService {
  /**
   * Generate AI insights from project data
   */
  static async generateInsights(
    projects: ProjectData[],
    tasks: TaskData[],
    teamMembers: TeamMemberData[]
  ): Promise<AIInsight[]> {
    try {
      const prompt = this.buildInsightsPrompt(projects, tasks, teamMembers)
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert project management analyst. Analyze the provided data and generate actionable insights in JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })

      const response = completion.choices[0]?.message?.content
      if (!response) throw new Error('No response from AI')

      return JSON.parse(response)
    } catch (error) {
      console.error('AI Insights generation error:', error)
      return this.getFallbackInsights(projects, tasks, teamMembers)
    }
  }

  /**
   * Generate AI recommendations
   */
  static async generateRecommendations(
    projects: ProjectData[],
    tasks: TaskData[],
    teamMembers: TeamMemberData[]
  ): Promise<AIRecommendation[]> {
    try {
      const prompt = this.buildRecommendationsPrompt(projects, tasks, teamMembers)
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a senior project management consultant. Provide strategic recommendations based on the project data in JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 2500
      })

      const response = completion.choices[0]?.message?.content
      if (!response) throw new Error('No response from AI')

      return JSON.parse(response)
    } catch (error) {
      console.error('AI Recommendations generation error:', error)
      return this.getFallbackRecommendations(projects, tasks, teamMembers)
    }
  }

  /**
   * Generate predictive analysis
   */
  static async generatePredictiveAnalysis(
    projects: ProjectData[],
    tasks: TaskData[],
    teamMembers: TeamMemberData[]
  ): Promise<PredictiveAnalysis> {
    try {
      const prompt = this.buildPredictivePrompt(projects, tasks, teamMembers)
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a data scientist specializing in project management predictions. Analyze trends and provide forecasts in JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      })

      const response = completion.choices[0]?.message?.content
      if (!response) throw new Error('No response from AI')

      return JSON.parse(response)
    } catch (error) {
      console.error('Predictive Analysis generation error:', error)
      return this.getFallbackPredictiveAnalysis(projects, tasks, teamMembers)
    }
  }

  /**
   * Build prompt for insights generation
   */
  private static buildInsightsPrompt(
    projects: ProjectData[],
    tasks: TaskData[],
    teamMembers: TeamMemberData[]
  ): string {
    return `
Analyze the following project management data and generate actionable insights:

PROJECTS:
${JSON.stringify(projects, null, 2)}

TASKS:
${JSON.stringify(tasks, null, 2)}

TEAM MEMBERS:
${JSON.stringify(teamMembers, null, 2)}

Generate insights in this JSON format:
[
  {
    "type": "warning|success|info|prediction",
    "title": "Brief insight title",
    "description": "Detailed description of the insight",
    "confidence": 0.85,
    "actionItems": ["Action 1", "Action 2"],
    "impact": "low|medium|high"
  }
]

Focus on:
- Budget overruns or savings
- Timeline risks or opportunities
- Team performance patterns
- Quality indicators
- Resource allocation issues
- Productivity trends

Provide 3-5 most important insights.
    `
  }

  /**
   * Build prompt for recommendations generation
   */
  private static buildRecommendationsPrompt(
    projects: ProjectData[],
    tasks: TaskData[],
    teamMembers: TeamMemberData[]
  ): string {
    return `
Based on the project data, provide strategic recommendations:

PROJECTS:
${JSON.stringify(projects, null, 2)}

TASKS:
${JSON.stringify(tasks, null, 2)}

TEAM MEMBERS:
${JSON.stringify(teamMembers, null, 2)}

Generate recommendations in this JSON format:
[
  {
    "category": "budget|timeline|team|quality|risk",
    "title": "Recommendation title",
    "description": "Detailed description",
    "priority": "low|medium|high",
    "estimatedImpact": "Expected outcome",
    "implementation": ["Step 1", "Step 2", "Step 3"]
  }
]

Focus on actionable recommendations for:
- Process improvements
- Resource optimization
- Risk mitigation
- Quality enhancement
- Team development

Provide 3-5 strategic recommendations.
    `
  }

  /**
   * Build prompt for predictive analysis
   */
  private static buildPredictivePrompt(
    projects: ProjectData[],
    tasks: TaskData[],
    teamMembers: TeamMemberData[]
  ): string {
    return `
Perform predictive analysis on the project data:

PROJECTS:
${JSON.stringify(projects, null, 2)}

TASKS:
${JSON.stringify(tasks, null, 2)}

TEAM MEMBERS:
${JSON.stringify(teamMembers, null, 2)}

Generate predictions in this JSON format:
{
  "projectCompletion": {
    "estimatedDate": "2024-12-15",
    "confidence": 0.78,
    "factors": ["Factor 1", "Factor 2"]
  },
  "budgetForecast": {
    "estimatedTotal": 125000,
    "overrunRisk": 0.25,
    "recommendations": ["Rec 1", "Rec 2"]
  },
  "teamPerformance": {
    "burnoutRisk": 0.15,
    "productivityTrend": "increasing|decreasing|stable",
    "recommendations": ["Rec 1", "Rec 2"]
  }
}

Base predictions on current trends, velocity, and historical patterns.
    `
  }

  /**
   * Fallback insights when AI is unavailable
   */
  private static getFallbackInsights(
    projects: ProjectData[],
    tasks: TaskData[],
    teamMembers: TeamMemberData[]
  ): AIInsight[] {
    const insights: AIInsight[] = []

    // Budget analysis
    const overBudgetProjects = projects.filter(p => p.spent > p.budget * 0.9)
    if (overBudgetProjects.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Budget Alert',
        description: `${overBudgetProjects.length} project(s) approaching budget limit`,
        confidence: 0.95,
        actionItems: ['Review budget allocation', 'Optimize resource usage'],
        impact: 'high'
      })
    }

    // Team workload
    const overloadedMembers = teamMembers.filter(m => m.workload > 80)
    if (overloadedMembers.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Team Overload',
        description: `${overloadedMembers.length} team member(s) have high workload`,
        confidence: 0.90,
        actionItems: ['Redistribute tasks', 'Consider additional resources'],
        impact: 'medium'
      })
    }

    return insights
  }

  /**
   * Fallback recommendations when AI is unavailable
   */
  private static getFallbackRecommendations(
    projects: ProjectData[],
    tasks: TaskData[],
    teamMembers: TeamMemberData[]
  ): AIRecommendation[] {
    return [
      {
        category: 'team',
        title: 'Improve Team Communication',
        description: 'Implement daily standups and weekly retrospectives',
        priority: 'medium',
        estimatedImpact: 'Increased productivity by 15-20%',
        implementation: ['Schedule daily standups', 'Set up retrospective meetings', 'Use collaboration tools']
      }
    ]
  }

  /**
   * Fallback predictive analysis when AI is unavailable
   */
  private static getFallbackPredictiveAnalysis(
    projects: ProjectData[],
    tasks: TaskData[],
    teamMembers: TeamMemberData[]
  ): PredictiveAnalysis {
    return {
      projectCompletion: {
        estimatedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        confidence: 0.70,
        factors: ['Current velocity', 'Team capacity']
      },
      budgetForecast: {
        estimatedTotal: projects.reduce((sum, p) => sum + p.budget, 0),
        overrunRisk: 0.20,
        recommendations: ['Monitor spending closely', 'Review resource allocation']
      },
      teamPerformance: {
        burnoutRisk: 0.25,
        productivityTrend: 'stable',
        recommendations: ['Maintain current pace', 'Monitor team satisfaction']
      }
    }
  }
}
