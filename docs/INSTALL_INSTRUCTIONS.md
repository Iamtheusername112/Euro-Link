# Fix: Module not found 'lucide-react'

## Quick Fix

Run these commands in your terminal (PowerShell or Command Prompt):

```bash
npm install lucide-react@0.263.1 --save
npm install @supabase/supabase-js --save
npm install sonner --save
```

Or run the script:
```bash
scripts/install-dependencies.bat
```

## Alternative: Clean Install

If the above doesn't work, try a clean install:

```bash
# Delete node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Reinstall all dependencies
npm install
```

## Verify Installation

After installing, verify the packages are installed:

```bash
npm list lucide-react
npm list @supabase/supabase-js
npm list sonner
```

You should see the packages listed. If not, there may be a network or npm configuration issue.

## If Still Not Working

1. **Check npm version**: `npm --version`
2. **Clear npm cache**: `npm cache clean --force`
3. **Try with yarn**: If you have yarn installed:
   ```bash
   yarn add lucide-react@0.263.1 @supabase/supabase-js sonner
   ```
4. **Check internet connection**: npm needs internet to download packages
5. **Check npm registry**: `npm config get registry` (should be https://registry.npmjs.org/)

## After Installation

Once packages are installed, restart your dev server:

```bash
npm run dev
```

The error should be resolved!

