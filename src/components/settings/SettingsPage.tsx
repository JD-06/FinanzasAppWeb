import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SettingsPage() {
  const { user, signOut, updatePassword } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })

async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setMsg({ text: '', type: '' })
    setLoading(true)
    try {
      await updatePassword(newPassword)
      setMsg({ text: 'Contraseña actualizada correctamente.', type: 'success' })
      setNewPassword('')
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">⚙️ Configuración</h2>
      
      <Card className="max-w-xl">
        <CardHeader><CardTitle className="text-base">Mi Perfil</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">ID de Usuario</p>
            <p className="font-mono text-xs text-muted-foreground break-all bg-muted p-2 rounded">{user?.id}</p>
          </div>
          <div className="pt-4 border-t">
            <Button variant="destructive" onClick={signOut}>Cerrar Sesión</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="max-w-xl">
        <CardHeader><CardTitle className="text-base">Cambiar Contraseña</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input 
                id="newPassword" 
                type="password" 
                value={newPassword} 
                onChange={(e: any) => setNewPassword(e.target.value)} 
                required 
                minLength={6}
              />
            </div>
            {msg.text && (
              <p className={`text-sm ${msg.type === 'error' ? 'text-destructive' : 'text-green-600'}`}>
                {msg.text}
              </p>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-xl">
        <CardHeader><CardTitle className="text-base">Acerca de</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Finanzas App</p>
          <p>Versión 1.0.0 by Jared Constantino</p>
        </CardContent>
      </Card>
    </div>
  )
}
