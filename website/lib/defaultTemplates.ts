export interface DefaultTemplate {
  id: string
  name: string
  description: string
  latex: string
}

const TEMPLATE_HARSHIBAR = `%-------------------------
% Resume in Latex
% Author : Harshibar
% Based off of: https://github.com/jakeryang/resume
% License : MIT
%------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}

\\usepackage{fontawesome5}
\\usepackage[scale=0.90,lf]{FiraMono}

\\definecolor{light-grey}{gray}{0.83}
\\definecolor{dark-grey}{gray}{0.3}
\\definecolor{text-grey}{gray}{.08}

\\DeclareRobustCommand{\\ebseries}{\\fontseries{eb}\\selectfont}
\\DeclareTextFontCommand{\\texteb}{\\ebseries}

\\usepackage{contour}
\\usepackage[normalem]{ulem}
\\renewcommand{\\ULdepth}{1.8pt}
\\contourlength{0.8pt}
\\newcommand{\\myuline}[1]{%
  \\uline{\\phantom{#1}}%
  \\llap{\\contour{white}{#1}}%
}

\\usepackage{tgheros}
\\renewcommand*\\familydefault{\\sfdefault}
\\usepackage[T1]{fontenc}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{0in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
    \\bfseries \\vspace{2pt} \\raggedright \\large
}{}{0em}{}[\\color{light-grey} {\\titlerule[2pt]} \\vspace{-4pt}]

\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-1pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-1pt}\\item
    \\begin{tabular*}{\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & {\\color{dark-grey}\\small #2}\\vspace{1pt}\\\\
      \\textit{#3} & {\\color{dark-grey} \\small #4}\\\\
    \\end{tabular*}\\vspace{-4pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{\\textwidth}{l@{\\extracolsep{\\fill}}r}
      #1 & {\\color{dark-grey}} \\\\
    \\end{tabular*}\\vspace{-4pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{0pt}}

\\color{text-grey}

\\begin{document}

%----------HEADING----------
\\begin{center}
    \\textbf{\\Huge Your Name} \\\\ \\vspace{5pt}
    \\small \\faPhone* \\texttt{555.555.5555} \\hspace{1pt}
    \\hspace{1pt} \\faEnvelope \\hspace{2pt} \\texttt{your@email.com} \\hspace{1pt}
    \\hspace{1pt} \\faLinkedin \\hspace{2pt} \\texttt{linkedin.com/in/yourprofile} \\hspace{1pt}
    \\hspace{1pt} \\faMapMarker* \\hspace{2pt}\\texttt{City, ST}
    \\\\ \\vspace{-3pt}
\\end{center}

%-----------EXPERIENCE-----------
\\section{EXPERIENCE}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Job Title}{Month Year -- Present}
      {Company Name}{City, ST}
      \\resumeItemListStart
        \\resumeItem{Led key initiative resulting in \\textbf{quantifiable outcome}}
        \\resumeItem{Collaborated with cross-functional teams to deliver X, improving Y by Z\\%}
      \\resumeItemListEnd
  \\resumeSubHeadingListEnd

%-----------EDUCATION-----------
\\section{EDUCATION}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Degree}{Month Year -- Month Year}
      {University Name}{City, ST}
  \\resumeSubHeadingListEnd

%-----------SKILLS-----------
\\section{SKILLS}
 \\begin{itemize}[leftmargin=0in, label={}]
    \\small{\\item{
     \\textbf{Languages}{: Python, JavaScript, SQL}\\vspace{2pt} \\\\
     \\textbf{Tools}{: Tool1, Tool2, Tool3}
    }}
 \\end{itemize}

\\end{document}`

export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  {
    id: 'harshibar',
    name: 'Classic Sans',
    description: 'Clean helvetica-style sans-serif, grey section rules',
    latex: TEMPLATE_HARSHIBAR,
  },
]
