'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

interface FormField {
  label: string
  name: string
  type: string
  variant: string
  required: boolean
  placeholder?: string
  disabled?: boolean
  checked?: boolean
  description?: string
}

interface FormData {
  [key: string]: string | number | boolean;
}

interface SchemaDefinition {
  [key: string]: z.ZodType;
}

const fetchFormConfig = async (): Promise<FormField[]> => {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts/1')
  if (!response.ok) {
    throw new Error('Failed to fetch form configuration')
  }
  const data = await response.json()

  return [
    {
      label: data.title,
      name: 'name_8066616423',
      type: 'text',
      variant: 'Input',
      required: true,
      placeholder: 'Enter your name',
      description: data.body
    },
    {
      label: 'Age',
      name: 'age_12345',
      type: 'number',
      variant: 'Input',
      required: true,
      placeholder: 'Enter your age'
    },
    {
      label: 'Agree to terms',
      name: 'terms_001',
      type: 'checkbox',
      variant: 'Checkbox',
      required: true,
      checked: false
    }
  ]
}

const submitFormData = async (data: FormData) => {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to submit form data')
  }
  return response.json()
}

export default function DynamicForm() {
  const [interactionCount, setInteractionCount] = useState(0)
  const [submissionId, setSubmissionId] = useState<number | null>(null)

  const { data: formFields, isLoading, error } = useQuery({
    queryKey: ['formConfig'],
    queryFn: fetchFormConfig,
  })

  const mutation = useMutation({
    mutationFn: submitFormData,
    onSuccess: (data) => {
      setSubmissionId(data.id)
    },
  })

  const schema = z.object(
    formFields?.reduce((acc: SchemaDefinition, field: FormField) => {
      if (field.type === 'checkbox') {
        acc[field.name] = z.boolean()
      } else if (field.type === 'number') {
        acc[field.name] = z.number().min(0)
      } else {
        acc[field.name] = z.string().min(1, { message: `${field.label} is required` })
      }
      return acc
    }, {}) || {}
  )

  const { control, handleSubmit, reset, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const age = watch('age_12345')

  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  const handleReset = () => {
    reset()
    setInteractionCount(0)
    setSubmissionId(null)
  }

  if (isLoading) return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  if (error) return (
    <Alert variant="destructive" className="max-w-md mx-auto mt-8">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>Failed to load form configuration. Please try again later.</AlertDescription>
    </Alert>
  )

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Dynamic Form</CardTitle>
        <CardDescription>Please fill out the form below</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {formFields?.map((field: FormField) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name} className="text-sm font-medium">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Controller
                name={field.name}
                control={control}
                defaultValue={field.checked || ''}
                render={({ field: { onChange, value, ...rest }, fieldState: { error } }) => {
                  switch (field.variant) {
                    case 'Input':
                      return (
                        <>
                          <Input
                            type={field.type}
                            placeholder={field.placeholder}
                            disabled={field.disabled}
                            {...rest}
                            value={typeof value === 'boolean' ? '' : value || ''}
                            onChange={(e) => {
                              onChange(field.type === 'number' ? parseInt(e.target.value) : e.target.value)
                              setInteractionCount((prev) => prev + 1)
                            }}
                            className="w-full"
                          />
                          {error && <p className="text-destructive text-sm mt-1">{error.message}</p>}
                        </>
                      )
                    case 'Checkbox':
                      return (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={field.name}
                            checked={Boolean(value)}
                            onCheckedChange={(checked) => {
                              onChange(checked)
                              setInteractionCount((prev) => prev + 1)
                            }}
                            {...rest}
                          />
                          <label htmlFor={field.name} className="text-sm text-muted-foreground">
                            {field.label}
                          </label>
                          {error && <p className="text-destructive text-sm ml-2">{error.message}</p>}
                        </div>
                      )
                    default:
                      return <div>Unsupported field variant: {field.variant}</div>
                  }
                }}
              />
              {field.description && <p className="text-sm text-muted-foreground mt-1">{field.description}</p>}
            </div>
          ))}

          {Number(age) > 18 && (
            <div className="space-y-2">
              <Label htmlFor="contact_method" className="text-sm font-medium">Preferred Contact Method</Label>
              <Controller
                name="contact_method"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={typeof field.value === 'string' ? field.value : ''}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select contact method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="flex space-x-2 w-full">
          <Button type="submit" onClick={handleSubmit(onSubmit)} disabled={mutation.isPending} className="flex-1">
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </Button>
          <Button type="button" variant="outline" onClick={handleReset} className="flex-1">
            Reset Form
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Interaction count: {interactionCount}</p>
        {submissionId && (
          <Alert>
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Form submitted successfully! Submission ID: {submissionId}</AlertDescription>
          </Alert>
        )}
      </CardFooter>
    </Card>
  )
}

