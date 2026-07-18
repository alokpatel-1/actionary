import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InitComponent } from './init.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { SignUpComponent } from './auth/sign-up/sign-up.component';
import { SignInComponent } from './auth/sign-in/sign-in.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { MobileLoginComponent } from './auth/mobile-login/mobile-login.component';
import { MobileSignupComponent } from './auth/mobile-signup/mobile-signup.component';

const routes: Routes = [
  {
    path: '',
    component: InitComponent,
    children: [
      { path: '', component: LandingPageComponent },
      { path: 'home', component: LandingPageComponent },
      { path: 'login', component: SignInComponent },
      { path: 'signup', component: SignUpComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'auth/login', component: MobileLoginComponent },
      { path: 'auth/signup', component: MobileSignupComponent },
    ]
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InitRoutingModule { }

