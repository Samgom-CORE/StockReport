"use client"

import { useEffect, useState } from "react"
import { ShieldCheck } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { createClient } from "@/lib/supabase/client"
import { useCurrentUser } from "@/lib/use-current-user"

type LoginEvent = {
  id: string
  email: string | null
  created_at: string
}

export default function LoginsPage() {
  const { isAdmin, loading: userLoading } = useCurrentUser()
  const [events, setEvents] = useState<LoginEvent[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("login_events")
        .select("id, email, created_at")
        .order("created_at", { ascending: false })
        .limit(200)
      if (cancelled) return
      if (error) {
        setError(error.message)
      } else {
        setEvents((data as LoginEvent[]) ?? [])
      }
      setLoaded(true)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-6 px-4 py-8 md:py-12">
      <header className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ShieldCheck className="size-6" aria-hidden="true" />
        </span>
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Sign-in History</h1>
          <p className="text-sm text-muted-foreground">
            {userLoading ? "" : isAdmin ? "Every sign-in, most recent first." : "Your own sign-ins."}
          </p>
        </div>
      </header>

      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="py-10">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ShieldCheck />
                  </EmptyMedia>
                  <EmptyTitle>Could not load sign-ins</EmptyTitle>
                  <EmptyDescription>{error}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : loaded && events.length === 0 ? (
            <div className="py-10">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ShieldCheck />
                  </EmptyMedia>
                  <EmptyTitle>No sign-ins yet</EmptyTitle>
                  <EmptyDescription>Sign-ins will appear here once staff start logging in.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Email</TableHead>
                  <TableHead>Signed in at</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell className="font-medium">{ev.email ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(ev.created_at).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
