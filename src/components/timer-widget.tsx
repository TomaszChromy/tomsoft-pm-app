'use client'

import { useState, useEffect } from 'react'
import { useTimer } from '@/hooks/use-timer'
import { PlayIcon, StopIcon, ClockIcon } from '@heroicons/react/24/outline'
// Temporary UI components - will be replaced with actual shadcn/ui components
const Button = ({ children, onClick, disabled, className, variant, size }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded ${variant === 'outline' ? 'border border-gray-300' : variant === 'destructive' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'} ${className}`}
  >
    {children}
  </button>
)

const Card = ({ children, className }: any) => (
  <div className={`border rounded-lg shadow-sm ${className}`}>{children}</div>
)

const CardHeader = ({ children }: any) => (
  <div className="p-4 border-b">{children}</div>
)

const CardTitle = ({ children }: any) => (
  <h3 className="text-lg font-semibold">{children}</h3>
)

const CardContent = ({ children, className }: any) => (
  <div className={`p-4 ${className}`}>{children}</div>
)

const Input = ({ value, onChange, placeholder, type, id, className }: any) => (
  <input
    id={id}
    type={type || 'text'}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full px-3 py-2 border rounded ${className}`}
  />
)

const Label = ({ children, htmlFor }: any) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium mb-1">{children}</label>
)

const Select = ({ children, value, onValueChange }: any) => (
  <select
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
    className="w-full px-3 py-2 border rounded"
  >
    {children}
  </select>
)

const SelectTrigger = ({ children }: any) => <>{children}</>
const SelectValue = ({ placeholder }: any) => <option value="">{placeholder}</option>
const SelectContent = ({ children }: any) => <>{children}</>
const SelectItem = ({ children, value }: any) => <option value={value}>{children}</option>

const Checkbox = ({ checked, onCheckedChange, id }: any) => (
  <input
    id={id}
    type="checkbox"
    checked={checked}
    onChange={(e) => onCheckedChange(e.target.checked)}
    className="mr-2"
  />
)

const Badge = ({ children, variant }: any) => (
  <span className={`px-2 py-1 text-xs rounded ${variant === 'outline' ? 'border' : 'bg-gray-200'}`}>
    {children}
  </span>
)

const Textarea = ({ value, onChange, placeholder, rows, id }: any) => (
  <textarea
    id={id}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    className="w-full px-3 py-2 border rounded"
  />
)

interface Project {
  id: string
  name: string
}

interface Task {
  id: string
  title: string
}

interface TimerWidgetProps {
  projects: Project[]
  tasks?: Task[]
  compact?: boolean
  className?: string
}

export function TimerWidget({ projects, tasks = [], compact = false, className = '' }: TimerWidgetProps) {
  const { timer, isLoading, error, startTimer, stopTimer, formatTime, isRunning } = useTimer()
  const [showStartForm, setShowStartForm] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    projectId: '',
    taskId: '',
    billable: true,
    hourlyRate: '',
    tags: [] as string[]
  })

  // Reset form when timer starts
  useEffect(() => {
    if (isRunning) {
      setShowStartForm(false)
    }
  }, [isRunning])

  const handleStart = async () => {
    if (!formData.projectId) {
      alert('Wybierz projekt')
      return
    }

    try {
      await startTimer({
        description: formData.description || undefined,
        projectId: formData.projectId,
        taskId: formData.taskId || undefined,
        billable: formData.billable,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        tags: formData.tags
      })
    } catch (error) {
      console.error('Failed to start timer:', error)
    }
  }

  const handleStop = async () => {
    try {
      await stopTimer()
    } catch (error) {
      console.error('Failed to stop timer:', error)
    }
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {isRunning && timer ? (
          <>
            <div className="flex items-center gap-2 text-sm">
              <ClockIcon className="h-4 w-4 text-green-500" />
              <span className="font-mono">{formatTime(timer.elapsedHours)}</span>
              <span className="text-gray-500">{timer.project.name}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleStop}
              disabled={isLoading}
            >
              <StopIcon className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowStartForm(true)}
            disabled={isLoading}
          >
            <PlayIcon className="h-3 w-3 mr-1" />
            Start Timer
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClockIcon className="h-5 w-5" />
          Time Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {isRunning && timer ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-green-600">
                {formatTime(timer.elapsedHours)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {timer.project.name}
                {timer.task && ` • ${timer.task.title}`}
              </div>
              {timer.description && (
                <div className="text-sm text-gray-600 mt-1">
                  {timer.description}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {timer.billable && (
                <Badge variant="secondary">Billable</Badge>
              )}
              {timer.tags.map(tag => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>

            <Button
              onClick={handleStop}
              disabled={isLoading}
              className="w-full"
              variant="destructive"
            >
              <StopIcon className="h-4 w-4 mr-2" />
              Stop Timer
            </Button>
          </div>
        ) : showStartForm ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="project">Projekt *</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz projekt" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {tasks.length > 0 && (
              <div>
                <Label htmlFor="task">Zadanie</Label>
                <Select
                  value={formData.taskId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, taskId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz zadanie (opcjonalne)" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map(task => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="description">Opis</Label>
              <Textarea
                id="description"
                placeholder="Co robisz?"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="billable"
                checked={formData.billable}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, billable: !!checked }))}
              />
              <Label htmlFor="billable">Billable</Label>
            </div>

            {formData.billable && (
              <div>
                <Label htmlFor="hourlyRate">Stawka godzinowa (PLN)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  placeholder="150"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleStart}
                disabled={isLoading || !formData.projectId}
                className="flex-1"
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                Start Timer
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowStartForm(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-gray-500 mb-4">
              Brak aktywnego timera
            </div>
            <Button
              onClick={() => setShowStartForm(true)}
              disabled={isLoading}
              className="w-full"
            >
              <PlayIcon className="h-4 w-4 mr-2" />
              Start Timer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
