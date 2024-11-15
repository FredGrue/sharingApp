import { Routes } from '@angular/router';
import { LoginPage } from './login/login.page';
import { HomePage } from './home/home.page';
import { WalletPage } from './wallet/wallet.page';
import { ProfilePage } from './profile/profile.page';
import { SettingsPage } from './settings/settings.page';
import { BacklogPage } from './backlog/backlog.page';
import { InboxPage } from './inbox/inbox.page';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginPage },
  { path: 'home', component: HomePage, canActivate: [AuthGuard] },
  { path: 'wallet', component: WalletPage, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfilePage, canActivate: [AuthGuard] },
  { path: 'settings', component: SettingsPage, canActivate: [AuthGuard] },
  { path: 'backlog', component: BacklogPage, canActivate: [AuthGuard] },
  { path: 'inbox', component: InboxPage, canActivate: [AuthGuard] },
];
