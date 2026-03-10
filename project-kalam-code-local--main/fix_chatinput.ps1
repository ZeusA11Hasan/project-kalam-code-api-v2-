$path = "d:\ai-agent\CHAT TUTOR\ui chat - Copy\chatbot-ui - Copy\components\chat\ChatInput.tsx"
$content = Get-Content $path
$newLines = @('    voiceMode?: boolean', '    onToggleVoiceMode?: () => void')
$finalContent = $content[0..18] + $newLines + $content[31..($content.Length-1)]
$finalContent | Set-Content $path
