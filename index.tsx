
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Geni AI Studio - Plateforme de Rédaction Premium</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      if (localStorage.getItem('genia_theme') === 'dark' || (!('genia_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            colors: { slate: { 750: '#1e293b', 850: '#0f172a', 950: '#020617' } },
            animation: { 'progress': 'progress 2s ease-in-out infinite' },
            keyframes: { progress: { '0%': { width: '0%', marginLeft: '0%' }, '50%': { width: '50%', marginLeft: '25%' }, '100%': { width: '100%', marginLeft: '100%' } } }
          }
        }
      }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        * { transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease; }
    </style>
    <script type="importmap">
    {
      "imports": {
        "@google/genai": "https://esm.sh/@google/genai@^1.40.0",
        "lucide-react": "https://esm.sh/lucide-react@^0.563.0",
        "jspdf": "https://esm.sh/jspdf@^2.5.1",
        "react-dom/": "https://esm.sh/react-dom@^19.2.4/",
        "react/": "https://esm.sh/react@^19.2.4/",
        "react": "https://esm.sh/react@^19.2.4",
        "pptxgenjs": "https://esm.sh/pptxgenjs@^3.12.0"
      }
    }
    </script>
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
    <div id="root"></div>
    <script type="module" src="index.tsx"></script>
</body>
</html>
