# Correção de deploy na Vercel

Este patch corrige o deploy removendo o package-lock antigo e forçando o npm a usar o registry público.

## Como usar

1. Extraia este patch por cima da pasta `C:\laragon\www\academia-saas-modelo`.
2. Rode o arquivo `corrigir-vercel.bat` dentro da raiz do projeto.
3. Na Vercel, confira:

- Root Directory: `frontend-vercel`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

4. Clique em Redeploy.
