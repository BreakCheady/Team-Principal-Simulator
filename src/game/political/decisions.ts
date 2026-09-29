export const ConflictDecisionId = {
  SUPPORT_MORETTI: "SUPPORT_MORETTI",
  COMPROMISE: "COMPROMISE",
  SUPPORT_CHEN: "SUPPORT_CHEN",
} as const;

export type ConflictDecisionId =
  (typeof ConflictDecisionId)[keyof typeof ConflictDecisionId];

export type ConflictDecisionOption = {
  id: ConflictDecisionId;
  label: string;
  description: string;
};

export const technicalDirectionDecisionOptions: ConflictDecisionOption[] = [
  {
    id: ConflictDecisionId.SUPPORT_MORETTI,
    label: "Support Moretti",
    description:
      "Give the star driver greater technical influence, accepting institutional cost.",
  },
  {
    id: ConflictDecisionId.COMPROMISE,
    label: "Offer compromise",
    description:
      "Increase Moretti's feedback weight while Chen keeps final technical authority.",
  },
  {
    id: ConflictDecisionId.SUPPORT_CHEN,
    label: "Support Chen",
    description:
      "Defend the technical chain of command and reinforce the existing precedent.",
  },
];
