import { ChatInterface } from "@/components/chat/chat-interface"
import { ErrorBoundary } from "@/components/error-boundary"
import { Suspense } from "react"
import Loading from "./loading"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl space-y-6">
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
            LLMSwitch
          </h1>
          <p className="max-w-[600px] text-muted-foreground">
            Seamlessly chat with Deepseek R1 and Claude LLMs
          </p>
        </div>
        
        <ErrorBoundary>
          <Suspense fallback={<Loading />}>
            <div className="mx-auto w-full max-w-4xl">
              <ChatInterface />
            </div>
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  )
}

export const dynamic = "force-dynamic"
export const revalidate = 0