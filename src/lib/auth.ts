import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

        if (!adminEmail || !adminPasswordHash) {
          console.error('Admin credentials not configured');
          return null;
        }

        // Check email
        if (credentials.email !== adminEmail) {
          return null;
        }

        // Check password
        const isValid = await bcrypt.compare(
          credentials.password as string,
          adminPasswordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: '1',
          email: adminEmail,
          name: 'Admin',
        };
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      const isOnLogin = nextUrl.pathname === '/admin/login';

      if (isOnAdmin) {
        if (isOnLogin) {
          // Allow access to login page
          if (isLoggedIn) {
            // Redirect to dashboard if already logged in
            return Response.redirect(new URL('/admin', nextUrl));
          }
          return true;
        }
        // Require auth for other admin pages
        return isLoggedIn;
      }

      return true;
    },
  },
  session: {
    strategy: 'jwt',
  },
  trustHost: true,
});

// Helper to generate password hash (run once to set up admin password)
export async function generatePasswordHash(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}
