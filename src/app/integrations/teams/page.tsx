'use client'

import { useState } from 'react'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { TeamsIntegration } from '@/components/teams/teams-integration'
import { AppLayout } from '@/components/layout/app-layout'

export default function TeamsIntegrationPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            title="Go back"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-lg">
                🟦
              </div>
              Microsoft Teams Integration
            </h1>
            <p className="text-gray-600 mt-1">
              Connect TomSoft PM with Microsoft Teams for seamless collaboration
            </p>
          </div>
        </div>

        {/* Integration Setup */}
        <TeamsIntegration />

        {/* Setup Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            📋 Setup Instructions
          </h3>
          <div className="space-y-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">1. Create Teams Webhook</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Open Microsoft Teams and go to your desired channel</li>
                <li>Click on the three dots (...) next to the channel name</li>
                <li>Select "Connectors" from the menu</li>
                <li>Find "Incoming Webhook" and click "Configure"</li>
                <li>Give your webhook a name (e.g., "TomSoft PM Notifications")</li>
                <li>Copy the webhook URL and add it to your environment variables</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">2. Environment Configuration</h4>
              <div className="bg-blue-100 rounded p-3 font-mono text-xs">
                <div>TEAMS_WEBHOOK_URL=your_webhook_url_here</div>
                <div>TEAMS_BOT_TOKEN=your_bot_token_here (optional)</div>
                <div>TEAMS_TENANT_ID=your_tenant_id_here (optional)</div>
                <div>TEAMS_CLIENT_ID=your_client_id_here (optional)</div>
                <div>TEAMS_CLIENT_SECRET=your_client_secret_here (optional)</div>
                <div>FRONTEND_URL=https://your-app-domain.com</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. Link Your Teams Account</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Find your Teams User ID in Teams settings</li>
                <li>Enter it in the "Account Linking" section above</li>
                <li>This enables presence updates and personal notifications</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">4. Configure Notifications</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Choose which events should trigger Teams notifications</li>
                <li>Test the connection to ensure everything works</li>
                <li>Customize notification settings for your team</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                🔔
              </div>
              <h3 className="font-semibold text-gray-900">Smart Notifications</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Get real-time notifications for project updates, task assignments, budget alerts, and more directly in your Teams channels.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                📅
              </div>
              <h3 className="font-semibold text-gray-900">Meeting Integration</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Create Teams meetings directly from projects, sync calendar events, and get meeting reminders for project discussions.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                👥
              </div>
              <h3 className="font-semibold text-gray-900">Presence Sync</h3>
            </div>
            <p className="text-gray-600 text-sm">
              See team member availability status from Teams, coordinate better, and know when colleagues are available for collaboration.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                📊
              </div>
              <h3 className="font-semibold text-gray-900">Daily Summaries</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Receive automated daily summaries of project progress, completed tasks, and team performance metrics.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                ⚠️
              </div>
              <h3 className="font-semibold text-gray-900">Budget Alerts</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Get immediate alerts when projects exceed budget thresholds, with detailed spending breakdowns and recommendations.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                🎯
              </div>
              <h3 className="font-semibold text-gray-900">Task Updates</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Stay informed about task assignments, completions, and overdue items with contextual information and quick actions.
            </p>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🔧 Troubleshooting
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <strong>Connection Test Fails:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Verify your webhook URL is correct and active</li>
                <li>Check that the Teams channel allows incoming webhooks</li>
                <li>Ensure your environment variables are properly set</li>
              </ul>
            </div>
            
            <div>
              <strong>Notifications Not Appearing:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Check notification settings in the configuration above</li>
                <li>Verify the webhook hasn't been disabled in Teams</li>
                <li>Look for error messages in the application logs</li>
              </ul>
            </div>
            
            <div>
              <strong>Presence Not Working:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Ensure your Teams User ID is correctly linked</li>
                <li>Check that you have the necessary permissions</li>
                <li>Verify Microsoft Graph API access (if configured)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
