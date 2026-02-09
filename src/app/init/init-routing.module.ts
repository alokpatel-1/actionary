import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingAppComponent } from './landing-app/landing-app.component';
import { SignUpComponent } from './auth/sign-up/sign-up.component';
import { SignInComponent } from './auth/sign-in/sign-in.component';
import { SplashComponent } from './splash/splash.component';
import { MobileLoginComponent } from './auth/mobile-login/mobile-login.component';
import { MobileSignupComponent } from './auth/mobile-signup/mobile-signup.component';

const routes: Routes = [
  { path: '', component: SplashComponent },
  { path: 'auth/login', component: MobileLoginComponent },
  { path: 'auth/signup', component: MobileSignupComponent },
  { path: 'login', component: SignInComponent },
  { path: 'signup', component: SignUpComponent },
  { path: 'landing', component: LandingAppComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InitRoutingModule { }
