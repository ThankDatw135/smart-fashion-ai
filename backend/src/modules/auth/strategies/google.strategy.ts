import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';

/**
 * Google OAuth 2.0 Strategy — xử lý đăng nhập bằng Google
 * Callback sẽ trả về profile Google để upsert user trong AuthService
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID', ''),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET', ''),
      callbackURL: configService.get<string>(
        'GOOGLE_CALLBACK_URL',
        'http://localhost:4000/api/v1/auth/google/callback',
      ),
      scope: ['email', 'profile'],
    });
  }

  /**
   * Validate — được gọi khi Google redirect về callback URL
   * Trích xuất email, tên, avatar, googleId từ profile
   */
  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const { id, emails, displayName, photos } = profile;

    let fullName = displayName || '';
    if (!fullName && profile.name) {
      fullName =
        `${profile.name.familyName || ''} ${profile.name.givenName || ''}`.trim();
    }

    // Dữ liệu từ Google profile — sẽ được dùng để upsert user
    const googleUser = {
      googleId: id,
      email: emails?.[0]?.value || '',
      fullName: fullName,
      avatarUrl: photos?.[0]?.value || null,
    };

    this.logger.log(`Google OAuth: ${googleUser.email}`);
    done(null, googleUser);
  }
}
