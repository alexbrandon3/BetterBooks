// src/context-engineering.ts

export const BetterBooksContext = {
  // 💬 Voice & Tone
  tone: {
    default: "Professional, calming, empowering.",
    nudges: "Supportive and encouraging.",
    data: "Formal and precise.",
    errors: "Clear and empathetic.",
    tooltips: "Simple, non-condescending explanations."
  },

  // 🧑‍💼 User Types
  userTypes: ["Small Business Owner", "Bookkeeper", "CPA", "AI-savvy Solo Founder"],
  userSupport: {
    priority: "Balanced",
    behaviorAdaption: true,
    tooltipFallbacks: true,
    accountantLanguage: true,
  },

  // 🔐 Development Philosophy
  devPhilosophy: {
    backend: "TypeORM with strict migrations and full auditability. Logic flows from double-entry integrity.",
    frontend: "React, Tailwind, shadcn/ui. Components must feel clear and forgiving.",
    architecture: "Fail safely. Explicit over clever. Predictability over speed.",
    caching: "Use LRU when safe, otherwise favor consistency.",
  },

  // 📈 Accounting Principles
  accountingPrinciples: {
    terminology: "GAAP-compliant, no euphemisms. Teach through UI, not avoidance.",
    trust: "Visual clarity builds trust — audit trails, summaries, undo flows.",
    control: "Automation must always explain itself and allow user reversal.",
    empowerment: "Design to make users feel capable and in control.",
  },

  // 🧠 Semantic Behavior Rules
  behaviorExamples: {
    suggestionOverrides: {
      track: true,
      display: "'Based on your past edits, we suggest: ...'"
    },
    previewSkips: {
      threshold: 3,
      autoQuickClose: true,
      explanationToast: true
    },
    tooltipActivation: {
      onHover: true,
      onHighOverrideRate: true,
      onFirstUse: true
    }
  },

  // 🎯 Product Vision
  goals: {
    shortTerm: [
      "Context-aware closing modal",
      "Override-aware suggestion engine",
      "Role-adaptive reporting summaries"
    ],
    longTerm: [
      "AI-assistant driven workflows",
      "Narrative financial reporting",
      "Full tax-readiness guidance engine"
    ]
  },

  // 🧩 Prompt Integration
  promptWrapping: {
    cursor: "This is for BetterBooks, an AI-driven accounting tool built in TypeORM + React + Tailwind for small business owners and CPAs. Maintain a professional tone, GAAP terminology, clear audit trails, and gentle guidance where ambiguity exists.",
    chatgpt: "This is a semantic-aware assistant working on BetterBooks. The user, Alex, values precision, empowerment, and user understanding. No assumptions — ask for clarification where needed."
  }
}; 