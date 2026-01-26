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
  }

  navigateToChat() {
    this.router.navigate(['/chat']);
  }
}
