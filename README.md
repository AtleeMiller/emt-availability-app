# EMT Availability App (backend version)

Steps to run:

1. Install dependencies

   ```bash
   npm install
   ```

2. Run Prisma migrate (creates SQLite database)

   ```bash
   npx prisma migrate dev --name init
   ```

3. Seed initial users (edit emails/passwords in `scripts/seed-users.ts` if you like)

   ```bash
   npm run seed
   ```

4. Start the dev server

   ```bash
   npm run dev
   ```

5. Visit http://localhost:3000 and log in with for example:

   - Email: atlee@example.com
   - Password: test1234

This has:

- Email/password login
- Users stored in SQLite through Prisma
- API for availability blocks at `/api/availability`
- Dashboard page at `/dashboard` (we'll mount the weekly calendar UI there next)
