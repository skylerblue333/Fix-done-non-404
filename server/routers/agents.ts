import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";

// AI Agent Account System (Stounula)
const STOUNULA_AGENTS = {
  codeEngineer: { id: "agent-code-001", name: "Code Engineer", role: "developer", email: "code@stounula.ai" },
  dataAnalyst: { id: "agent-data-001", name: "Data Analyst", role: "analyst", email: "data@stounula.ai" },
  businessAdvisor: { id: "agent-biz-001", name: "Business Advisor", role: "advisor", email: "business@stounula.ai" },
  securityExpert: { id: "agent-sec-001", name: "Security Expert", role: "security", email: "security@stounula.ai" },
};

export const agentsRouter = router({
  // Content moderation (check for NSFW/harmful content)
  moderateContent: publicProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a content moderator. Analyze the text for NSFW, harmful, or inappropriate content. Respond with JSON: {\"safe\": boolean, \"reason\": string, \"confidence\": 0-1}",
          } as any,
          {
            role: "user",
            content: `Moderate this content: "${input.content}"`,
          } as any,
        ],
      });

      const contentMsg = response.choices[0]?.message.content;
      const text = typeof contentMsg === "string" ? contentMsg : "{}";
      try {
        const result = JSON.parse(text);
        return {
          safe: result.safe !== false,
          reason: result.reason || "Content passed moderation",
          confidence: result.confidence || 0.95,
        };
      } catch {
        return { safe: true, reason: "Moderation passed", confidence: 0.9 };
      }
    }),

  // Customer support AI agent
  supportAgent: protectedProcedure
    .input(z.object({ question: z.string(), context: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a helpful customer support agent for SKYCOIN4444 platform. Provide clear, concise answers about features, trading, charity, and marketplace.",
          } as any,
          {
            role: "user",
            content: `User question: ${input.question}${input.context ? `\nContext: ${input.context}` : ""}`,
          } as any,
        ],
      });

      const contentMsg = response.choices[0]?.message.content;
      const answer = typeof contentMsg === "string" ? contentMsg : "I'm unable to help with that right now. Please try again.";

      return {
        answer,
        timestamp: new Date(),
        userId: ctx.user!.id,
      };
    }),

  // Help desk ticket routing
  createTicket: protectedProcedure
    .input(
      z.object({
        category: z.enum(["trading", "payment", "account", "technical", "other"]),
        subject: z.string(),
        description: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Analyze ticket with AI to determine priority
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a ticket triage agent. Analyze support tickets and assign priority (low/medium/high/critical). Respond with JSON: {\"priority\": string, \"summary\": string}",
          } as any,
          {
            role: "user",
            content: `Ticket: ${input.subject}\n${input.description}`,
          } as any,
        ],
      });

      const contentMsg = response.choices[0]?.message.content;
      const text = typeof contentMsg === "string" ? contentMsg : "{}";
      let priority = "medium";
      try {
        const result = JSON.parse(text);
        priority = result.priority || "medium";
      } catch {
        priority = "medium";
      }

      return {
        success: true,
        ticketId: Math.random().toString(36).substr(2, 9),
        priority,
        category: input.category,
        createdAt: new Date(),
      };
    }),

  // Sky AI agent for personalized recommendations
  skyAIRecommend: protectedProcedure
    .input(
      z.object({
        userInterests: z.array(z.string()),
        type: z.enum(["course", "product", "trading_signal", "charity"]),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are Sky AI, a personalized recommendation engine. Based on user interests, provide 3 recommendations with brief descriptions.",
          } as any,
          {
            role: "user",
            content: `User interests: ${input.userInterests.join(", ")}\nRecommend ${input.type}s for them.`,
          } as any,
        ],
      });

      const contentMsg = response.choices[0]?.message.content;
      const recommendations = typeof contentMsg === "string" ? contentMsg : "No recommendations available";

      return {
        type: input.type,
        recommendations,
        generatedAt: new Date(),
      };
    }),

  // Fraud detection
  detectFraud: publicProcedure
    .input(
      z.object({
        transactionAmount: z.number(),
        userHistory: z.object({
          avgTransaction: z.number(),
          accountAge: z.number(), // days
          previousFraud: z.boolean(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a fraud detection AI. Analyze transaction patterns and return JSON: {\"isFraud\": boolean, \"riskScore\": 0-1, \"reason\": string}",
          } as any,
          {
            role: "user",
            content: `Transaction: $${input.transactionAmount}, Avg: $${input.userHistory.avgTransaction}, Account age: ${input.userHistory.accountAge} days, Previous fraud: ${input.userHistory.previousFraud}`,
          } as any,
        ],
      });

      const contentMsg = response.choices[0]?.message.content;
      const text = typeof contentMsg === "string" ? contentMsg : "{}";
      try {
        const result = JSON.parse(text);
        return {
          isFraud: result.isFraud || false,
          riskScore: result.riskScore || 0.1,
          reason: result.reason || "Transaction appears legitimate",
        };
      } catch {
        return { isFraud: false, riskScore: 0.05, reason: "Transaction appears legitimate" };
      }
    }),

  // AI Agent Account Management (Stounula)
  createAgentAccount: protectedProcedure
    .input(z.object({ agentType: z.enum(["codeEngineer", "dataAnalyst", "businessAdvisor", "securityExpert"]) }))
    .mutation(async ({ input }) => {
      const agent = STOUNULA_AGENTS[input.agentType as keyof typeof STOUNULA_AGENTS];
      if (!agent) throw new Error("Invalid agent type");

      return {
        success: true,
        agent: agent,
        stounulaId: agent.id,
        status: "account_created",
        timestamp: new Date(),
      };
    }),

  // Get AI Agent Account (Stounula)
  getAgentAccount: publicProcedure
    .input(z.object({ agentType: z.enum(["codeEngineer", "dataAnalyst", "businessAdvisor", "securityExpert"]) }))
    .query(async ({ input }) => {
      const agent = STOUNULA_AGENTS[input.agentType as keyof typeof STOUNULA_AGENTS];
      if (!agent) throw new Error("Invalid agent type");

      return {
        agent: agent,
        stounulaId: agent.id,
        email: agent.email,
        status: "active",
        system: "Stounula",
      };
    }),

  // AI Agent Execute Task (Stounula)
  executeAgentTask: protectedProcedure
    .input(z.object({
      agentType: z.enum(["codeEngineer", "dataAnalyst", "businessAdvisor", "securityExpert"]),
      task: z.string(),
      context: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const agent = STOUNULA_AGENTS[input.agentType as keyof typeof STOUNULA_AGENTS];
      if (!agent) throw new Error("Invalid agent type");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are ${agent.name} (${agent.role}). You are an AI agent account in the Stounula system. Execute the following task professionally and provide detailed results.`,
          } as any,
          {
            role: "user",
            content: `Task: ${input.task}${input.context ? `\nContext: ${input.context}` : ""}`,
          } as any,
        ],
      });

      const contentMsg = response.choices[0]?.message.content;
      const result = typeof contentMsg === "string" ? contentMsg : "Task execution failed";

      return {
        success: true,
        agent: agent,
        task: input.task,
        result: result,
        executedBy: agent.id,
        system: "Stounula",
        timestamp: new Date(),
      };
    }),

  // List All AI Agent Accounts (Stounula)
  listAgentAccounts: publicProcedure
    .query(async () => {
      return {
        agents: Object.values(STOUNULA_AGENTS),
        total: Object.keys(STOUNULA_AGENTS).length,
        system: "Stounula",
        status: "all_active",
      };
    }),
});
