import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { ChatHeaderComponent } from '../../components/chat-header/chat-header.component';
import { MessageListComponent } from '../../components/message-list/message-list.component';
import { ChatInputComponent } from '../../components/chat-input/chat-input.component';
import { UseChatHook } from '../../hooks/use-chat.hook';
import { UseVoiceHook } from '../../hooks/use-voice.hook';
import { INPUT_PLACEHOLDER } from '../../constants/messages.constants';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    ChatHeaderComponent,
    MessageListComponent,
    ChatInputComponent
  ]
})
export class ChatPage implements OnInit, OnDestroy {
  inputText: string = '';
  readonly placeholder = INPUT_PLACEHOLDER;

  constructor(
    public chatHook: UseChatHook,
    public voiceHook: UseVoiceHook
  ) {}

  ngOnInit(): void {
    // Initialization handled by hooks
  }

  ngOnDestroy(): void {
    this.voiceHook.endConversation();
  }

  handleSendMessage(): void {
    if (this.inputText.trim()) {
      this.chatHook.sendMessage(this.inputText);
      this.inputText = '';
    }
  }

  handleVoiceClick(): void {
    if (this.voiceHook.isConnected()) {
      this.voiceHook.endConversation();
    } else {
      this.voiceHook.startConversation((role: string, message: string) => {
        if (role === 'user') {
          this.chatHook.addMessage(message, 'user');
        } else if (role === 'ai' || role === 'agent') {
          this.chatHook.addMessage(message, 'ai');
        }
      });
    }
  }
}
