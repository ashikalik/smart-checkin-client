import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonText, IonGrid, IonRow, IonCol, IonIcon } from '@ionic/angular/standalone';
import { airplaneOutline, micOutline, chatbubbleEllipsesOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [IonContent, IonButton, IonText, IonGrid, IonRow, IonCol, IonIcon]
})
export class WelcomePage {
  constructor(private router: Router) {
    addIcons({ airplaneOutline, micOutline, chatbubbleEllipsesOutline });
    console.log('WelcomePage initialized');
  }

  navigateToChat() {
    console.log('navigateToChat() called');
    console.log('Current router URL:', this.router.url);
    this.router.navigate(['/chat']).then(success => {
      console.log('Navigation result:', success);
      if (!success) {
        console.error('Navigation failed!');
      }
    }).catch(error => {
      console.error('Navigation error:', error);
    });
  }
  navigateToAgent() {
    console.log('navigateToChat() called');
    console.log('Current router URL:', this.router.url);
    this.router.navigate(['/voice-agent']).then(success => {
      console.log('Navigation result:', success);
      if (!success) {
        console.error('Navigation failed!');
      }
    }).catch(error => {
      console.error('Navigation error:', error);
    });
  }
}
