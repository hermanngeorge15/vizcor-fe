import { createFileRoute } from '@tanstack/react-router'
import { Button, Card, CardBody, CardHeader, Spinner } from '@heroui/react'
import { FiPlay, FiPlusCircle } from 'react-icons/fi'
import { Layout } from '@/components/Layout'
import { useScenarios } from '@/hooks/use-scenarios'
import { useCreateSession } from '@/hooks/use-sessions'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/scenarios/')({
  component: ScenariosPage,
})

function ScenariosPage() {
  const { data, isLoading } = useScenarios()
  const createSession = useCreateSession()
  const navigate = useNavigate()
  const [preparingScenario, setPreparingScenario] = useState<string | null>(null)

  const handlePrepare = async (scenarioId: string, scenarioName: string) => {
    setPreparingScenario(scenarioId)
    try {
      // Create a new session for the scenario
      const result = await createSession.mutateAsync(`scenario-${scenarioName}`)
      // Navigate to the session with scenario info
      navigate({ 
        to: '/sessions/$sessionId', 
        params: { sessionId: result.sessionId },
        search: { scenarioId, scenarioName }
      })
    } finally {
      setPreparingScenario(null)
    }
  }

  return (
    <Layout>
      <div className="container-custom py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Scenarios</h1>
          <Button
            color="success"
            startContent={<FiPlusCircle />}
            onPress={() => navigate({ to: '/scenarios/builder' })}
            size="lg"
          >
            Build Custom Scenario
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : !data?.scenarios || data.scenarios.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-center text-default-500">No scenarios available.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {data.scenarios.map(scenario => (
              <Card key={scenario.id}>
                <CardHeader>
                  <h3 className="text-xl font-semibold">{scenario.name}</h3>
                </CardHeader>
                <CardBody>
                  <p className="mb-4 text-default-600">{scenario.description}</p>
                  <Button
                    color="primary"
                    startContent={<FiPlay />}
                    onPress={() => handlePrepare(scenario.id, scenario.name)}
                    isLoading={preparingScenario === scenario.id}
                  >
                    Prepare Scenario
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

