'use client'

import dynamic from 'next/dynamic'

const DynamicForm = dynamic(() => import('@/components/DynamicForm'), {
  ssr: false,
})

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dynamic Form</h1>
      <DynamicForm />
    </main>
  )
}

