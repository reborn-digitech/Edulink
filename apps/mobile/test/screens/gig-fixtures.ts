import { gigMyContributionsSchema } from "@edulink/contracts";

/** What GET /api/v1/gigs/questions answers a teacher, for the two screens that read it. Only ZZ data. */
const TEXT = { stem: "ZZ How many sides has a triangle?", choices: ["Two", "Three"], solution: "ZZ Three sides." };
const question = (over: Record<string, unknown>) => ({ id: "q1", topic: { id: "t1", name: "ZZ Shapes", subject: "MATHS", classLevel: 3, chapter: "ZZ Chapter 5" }, difficulty: 1, answerIndex: 1, en: TEXT, hi: TEXT, mr: TEXT, status: "SUBMITTED", reviewNote: null, reviewedAt: null, submittedAt: "2026-09-30T10:00:00.000Z", questionId: null, earning: null, open: true, ...over });
const SETTINGS = { questionRatePaise: 1000, questionFreeCount: 20, questionMonthlyCap: 200, questionMonthlyBudgetPaise: 500000, questionDailyLimit: 20, questionPendingLimit: 50, pupilFreeOneToOnes: 2, pupilFreeWorkshops: 2, expertStartOneToOnes: 10, expertStartWorkshops: 2, expertMonthlyOneToOnes: 2, expertQuarterlyWorkshops: 1, teacherMonthlyGuidance: 2, freeCancelHours: 12, workshopMaxSeats: 30 };
export const MINE = (over: Record<string, unknown> = {}) =>
  gigMyContributionsSchema.parse({
    settings: SETTINGS,
    standing: { accepted: 21, freeLeft: 0, paidThisMonth: 1, paidLeftThisMonth: 199, duePaise: 1000, paidPaise: 0, sentToday: 2, waiting: 1 },
    payee: { upiId: "zz.teacher@zzbank", payeeName: "ZZ Teacher" },
    draftOn: false,
    contributions: [
      question({}),
      question({ id: "q2", en: { ...TEXT, stem: "ZZ An unpaid one" }, status: "ACCEPTED", open: false, questionId: "bank1", earning: { amountPaise: 0, basis: "FREE_BLOCK", month: "2026-09", paid: false } }),
      question({ id: "q3", en: { ...TEXT, stem: "ZZ A paid one" }, status: "ACCEPTED", open: false, questionId: "bank2", earning: { amountPaise: 1000, basis: "PAID", month: "2026-09", paid: false } }),
    ],
    ...over,
  });
