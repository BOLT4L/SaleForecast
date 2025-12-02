"use client"

import { useState } from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "../../context/ThemeContext"
import { Button } from "../../components/ui/Button"
import { Label } from "../../components/ui/Label"
import { RadioGroup, RadioGroupItem } from "../../components/ui/RadioGroup"
import { Separator } from "../../components/ui/Separator"
import { Switch } from "../../components/ui/Switch"

const SystemSettings = () => {
  const { theme, setTheme } = useTheme()
  const [notifications, setNotifications] = useState(true)
  const [dataRefresh, setDataRefresh] = useState(5)

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Appearance</h3>
          <p className="text-muted-foreground">Customize the appearance of the application</p>
        </div>

        <RadioGroup value={theme} onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
                <Sun className="h-4 w-4" />
                Light
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
                <Moon className="h-4 w-4" />
                Dark
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer">
                <Monitor className="h-4 w-4" />
                System
              </Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Notifications</h3>
          <p className="text-muted-foreground">Configure notification settings</p>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="notifications">Enable notifications</Label>
          <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Data Refresh</h3>
          <p className="text-muted-foreground">Configure how often data is refreshed</p>
        </div>

        <RadioGroup value={String(dataRefresh)} onValueChange={(value) => setDataRefresh(Number(value))}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1" id="refresh-1" />
              <Label htmlFor="refresh-1" className="cursor-pointer">
                1 minute
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="5" id="refresh-5" />
              <Label htmlFor="refresh-5" className="cursor-pointer">
                5 minutes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="15" id="refresh-15" />
              <Label htmlFor="refresh-15" className="cursor-pointer">
                15 minutes
              </Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      <div className="flex justify-end">
        <Button>Save Settings</Button>
      </div>
    </div>
  )
}

export default SystemSettings
