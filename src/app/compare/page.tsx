"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { FunLoading } from "@/components/ui/fun-loading"
import { useChat } from "@/hooks/use-chat"
import { ChevronDown, ChevronRight } from "lucide-react"

const COMPARISON_PROMPTS = [
  {
    id: "ethical",
    title: "Ethical Dilemma",
    prompt: "You are a doctor with one dose of medicine left. Two patients need it urgently - a young child and an elderly scientist who's close to curing cancer. Who should receive the medicine and why?"
  },
  {
    id: "logic",
    title: "Logic Puzzle",
    prompt: "In a room there are 5 machines. Each machine takes exactly 2 minutes to produce a widget. How many widgets can be produced in 6 minutes?"
  },
  {
    id: "creative",
    title: "Creative Problem",
    prompt: "Design a sustainable city transportation system that could work underwater."
  },
  {
    id: "analysis",
    title: "Complex Analysis",
    prompt: "Analyze the potential long-term implications of widespread AI adoption in healthcare, considering both benefits and risks."
  },
  {
    id: "abstract",
    title: "Abstract Reasoning",
    prompt: "If memories were physical objects, how would you organize and store them? Describe your system."
  },
  {
    id: "systems",
    title: "Systems Thinking",
    prompt: "Explain how a small change in ocean temperature could lead to changes in global weather patterns, economies, and human migration. Map out the cascade of effects."
  }
]

interface ComparisonState {
  [key: string]: {
    content: string
    reasoning?: string | null
  }
}

const cleanText = (text: string): string => {
  return text
    .replace(/\\\(|\\\)/g, '') // Remove LaTeX delimiters
    .replace(/\\boxed{([^}]+)}/g, '$1') // Remove boxed formatting
    .replace(/\\text{([^}]+)}/g, '$1') // Remove LaTeX text formatting
    .replace(/\*\*/g, '') // Remove markdown bold
    .replace(/\\times/g, 'x') // Replace LaTeX multiplication
    .replace(/\\frac{([^}]+)}{([^}]+)}/g, '$1/$2') // Convert fractions
    .replace(/\[|\]/g, '') // Remove square brackets
    .replace(/([^:]):\s*(?=\n|$)/g, '$1') // Remove colons at end of sentences
    .replace(/"([^"]+)"/g, (match, p1) => {
      // Keep quotes only for direct quotes from responses
      return p1.includes('said') || p1.includes('wrote') || p1.includes('states') ? match : p1;
    })
    .replace(/_"/g, '') // Remove underscore quotes
    .replace(/_([^_]+)_/g, '$1') // Remove underscores around text
    .replace(/\\(?![a-zA-Z{])/g, '') // Remove standalone backslashes but keep LaTeX commands
    .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Ensure space after sentence endings
    .replace(/(\d)\s*([A-Za-z])/g, '$1 $2') // Ensure space between numbers and letters
    .replace(/([A-Za-z])\s*(\d)/g, '$1 $2') // Ensure space between letters and numbers
    .replace(/=\s*(\d)/g, '= $1') // Ensure space after equals sign
    .replace(/([^\s])\s*=\s*([^\s])/g, '$1 = $2') // Ensure space around equals sign
    .replace(/[ \t]+/g, ' ') // Normalize horizontal whitespace
    .replace(/\n\s*\n\s*\n+/g, '\n\n') // Replace 3+ newlines with 2
    .replace(/^\s+|\s+$/gm, '') // Trim start/end whitespace of each line
    .trim();
};

export default function ComparePage() {
  const [selectedPrompt, setSelectedPrompt] = React.useState<string | null>(null)
  const [responses, setResponses] = React.useState<ComparisonState>({})
  const [analysis, setAnalysis] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)

  const { sendMessage } = useChat()

  const getComparativeAnalysis = async (responses: ComparisonState, prompt: string) => {
    try {
      setIsAnalyzing(true)
      
      // First, let's format the responses in a clear way
      const formattedResponses = `
ORIGINAL PROMPT:
"${prompt}"

===== RESPONSE 1: DEEPSEEK R1 =====
${responses.deepseek.content}

DEEPSEEK'S REASONING PROCESS:
${responses.deepseek.reasoning || 'No explicit reasoning provided'}

===== RESPONSE 2: CLAUDE SONNET 3.5 =====
${responses.claude.content}

===== RESPONSE 3: CLAUDE SONNET 3.5 WITH DEEPSEEK REASONING =====
${responses.claude_reasoning.content}

REASONING PROCESS THAT ENHANCED THIS RESPONSE:
${responses.claude_reasoning.reasoning || 'No explicit reasoning provided'}
`

      const analysisPrompt = `Analyze these three responses to the prompt: "${prompt}"

${formattedResponses}

Provide a structured analysis using the following format. Use ### for main sections and bullet points (•) for details:

### 1. KEY DIFFERENCES IN APPROACH

Organization & Structure:
• How did Deepseek R1 organize its solution? [quote structure]
• How did Claude structure its response? [quote structure]
• How did Claude + Reasoning organize its solution? [quote structure]

Technical Detail:
• What specific technical details did Deepseek R1 provide? [quote details]
• What technical aspects did Claude focus on? [quote details]
• How did Claude + Reasoning handle technical specifics? [quote details]

Focus Areas:
• What unique elements did Deepseek R1 emphasize? [quote examples]
• What distinct aspects did Claude prioritize? [quote examples]
• What special focus areas emerged in Claude + Reasoning? [quote examples]

### 2. SHARED ELEMENTS

Core Technologies:
• What key technologies appeared in all responses? [quote each instance]
• What common technical approaches were used? [quote examples]

Common Challenges:
• What specific challenges did all responses identify? [quote each]
• How did they approach these shared challenges? [quote approaches]

Shared Priorities:
• What key priorities were consistent across all responses? [quote examples]
• What common goals or objectives emerged? [quote instances]

### 3. STANDOUT STRENGTHS

Deepseek R1 Strengths:
• [Quote specific technical or analytical strength]
• [Quote unique insight or approach]
• [Quote distinctive feature]

Claude Strengths:
• [Quote specific technical or analytical strength]
• [Quote unique insight or approach]
• [Quote distinctive feature]

Combined Approach Strengths:
• [Quote specific enhancement from reasoning]
• [Quote improved insight or approach]
• [Quote distinctive synergy]

### 4. EFFECTIVENESS ANALYSIS

Most Effective Approach:
• Which response was most effective? [name and explain why]
• [Quote key evidence supporting this judgment]
• [Quote additional supporting example]

Best Use Cases:
• Deepseek R1: [quote content suggesting ideal applications]
• Claude: [quote content suggesting ideal applications]
• Combined: [quote content suggesting ideal applications]

For each point, use direct quotes from the responses to support your analysis. Focus on specific details and concrete examples rather than general observations.`

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: analysisPrompt,
          models: ["deepseek"]
        })
      })
      
      const data = await response.json()
      if (response.ok && data.deepseek) {
        setAnalysis(data.deepseek.content)
      }
    } catch (error) {
      console.error("Error generating analysis:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handlePromptSelect = async (promptId: string) => {
    setSelectedPrompt(promptId)
    setIsLoading(true)
    setResponses({})
    setAnalysis(null)

    const prompt = COMPARISON_PROMPTS.find(p => p.id === promptId)
    if (!prompt) return

    try {
      // First, get all responses in parallel
      console.log('Fetching responses...')
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: prompt.prompt,
          models: ["deepseek", "claude", "claude_reasoning"]
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(`Error fetching responses: ${data.error || 'Unknown error'}`)
      }

      const data = await response.json()
      console.log('Responses:', data)
      setResponses(data)

      // Generate comparative analysis
      if (data.deepseek && data.claude && data.claude_reasoning) {
        await getComparativeAnalysis(data, prompt.prompt)
      }
    } catch (error) {
      console.error("Error fetching responses:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Compare Model Responses</h1>
          <p className="text-muted-foreground">
            Select a prompt to see how different models approach the same problem.
            Compare the reasoning and responses between Deepseek R1, Claude, and Claude enhanced with reasoning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {COMPARISON_PROMPTS.map((prompt) => (
            <Card
              key={prompt.id}
              className={`p-4 cursor-pointer transition-colors hover:bg-accent ${
                selectedPrompt === prompt.id ? "border-primary" : ""
              }`}
              onClick={() => handlePromptSelect(prompt.id)}
            >
              <h3 className="font-semibold mb-2">{prompt.title}</h3>
              <p className="text-sm text-muted-foreground">{prompt.prompt}</p>
            </Card>
          ))}
        </div>

        {isLoading && (
          <div className="py-8">
            <FunLoading />
          </div>
        )}

        {!isLoading && selectedPrompt && Object.keys(responses).length > 0 && (
          <>
            {analysis && (
              <Card className="p-6 bg-gradient-to-b from-muted/50 to-background border-t-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    Comparative Analysis
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Key insights from comparing the different approaches
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {analysis.split(/(?=### \d+\.)/).map((section, index) => {
                      if (!section.trim()) return null;
                      
                      // Extract the section title and content
                      const [titleLine, ...contentLines] = section.split('\n');
                      const title = titleLine.replace(/^### \d+\.\s*/, '');
                      
                      // Group content by subsections
                      const subsections: { title: string; content: string[] }[] = [];
                      let currentSubsection: { title: string; content: string[] } | null = null;
                      
                      contentLines.forEach(line => {
                        const trimmedLine = line.trim();
                        if (!trimmedLine) return;
                        
                        if (trimmedLine.startsWith('•')) {
                          // This is a bullet point
                          if (currentSubsection) {
                            // Clean up the content
                            const cleanedContent = cleanText(trimmedLine);
                            if (cleanedContent) {
                              currentSubsection.content.push(cleanedContent);
                            }
                          }
                        } else if (trimmedLine.endsWith(':')) {
                          // This is a subsection header
                          currentSubsection = { title: trimmedLine.slice(0, -1), content: [] };
                          subsections.push(currentSubsection);
                        }
                      });

                      return (
                        <div key={index} className="relative pb-4 last:pb-0">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-base font-semibold text-primary">
                              {title}
                            </h3>
                            <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent"></div>
                          </div>
                          
                          <div className="grid gap-4">
                            {subsections.map((subsection, idx) => (
                              <div key={idx} className="space-y-2">
                                <h4 className="text-sm font-medium text-primary/80 pl-3 border-l border-primary/20">
                                  {subsection.title}
                                </h4>
                                <div className="pl-3 space-y-1">
                                  {subsection.content.map((bullet, bulletIdx) => (
                                    <div key={bulletIdx} 
                                      className="group flex items-start gap-2 py-0.5 px-2 rounded hover:bg-muted/50 transition-colors"
                                    >
                                      <span className="h-1.5 w-1.5 mt-1.5 rounded-full bg-primary/60 group-hover:bg-primary transition-colors"></span>
                                      <span className="text-sm text-muted-foreground group-hover:text-foreground">
                                        {bullet.substring(1).trim()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {isAnalyzing && (
              <div className="flex justify-center items-center gap-3 py-6">
                <LoadingSpinner size="sm" />
                <p className="text-sm text-muted-foreground">Analyzing responses...</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {Object.entries(responses).map(([model, response]) => (
                <Card key={model} className="overflow-hidden border-t-2 border-primary/20">
                  <div className="p-4 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                        {model === "deepseek"
                          ? "Deepseek R1"
                          : model === "claude"
                          ? "Claude"
                          : "Claude with Reasoning"}
                      </h3>
                      {response.reasoning && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-foreground group"
                          onClick={(e) => {
                            e.stopPropagation()
                            const element = document.getElementById(`reasoning-${model}`)
                            if (element) {
                              const isExpanded = element.getAttribute('data-expanded') === 'true'
                              element.style.maxHeight = isExpanded ? '0' : `${element.scrollHeight}px`
                              element.setAttribute('data-expanded', (!isExpanded).toString())
                              const icon = document.getElementById(`icon-${model}`)
                              if (icon) {
                                icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(90deg)'
                              }
                            }
                          }}
                        >
                          <span className="text-sm group-hover:text-primary transition-colors">Reasoning</span>
                          <ChevronRight 
                            id={`icon-${model}`}
                            className="h-4 w-4 transition-transform duration-200 ml-1 group-hover:text-primary"
                          />
                        </Button>
                      )}
                    </div>
                    <div className="text-sm leading-relaxed">
                      {cleanText(response.content).split('\n').map((paragraph, idx) => (
                        <p key={idx} className="mb-2 last:mb-0">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    {response.reasoning && (
                      <div 
                        id={`reasoning-${model}`}
                        data-expanded="false"
                        className="overflow-hidden transition-all duration-200 ease-in-out"
                        style={{ maxHeight: 0 }}
                      >
                        <div className="pt-4 border-t border-border/50">
                          <h4 className="text-sm font-medium mb-2 text-primary/90">Reasoning Process</h4>
                          <div className="text-sm text-muted-foreground space-y-2">
                            {cleanText(response.reasoning).split('\n').map((paragraph, idx) => (
                              <p key={idx}>{paragraph}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
} 