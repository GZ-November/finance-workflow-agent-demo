/**
 * Demo 模板选择规则（hard-code，供业务人员后续替换）。
 * 这些模板名称属于 Demo 配置，不代表最终合规文件清单。
 */
export interface TemplateRule {
  id: string;
  classification: string;
  condition: string;
  launchPack: string[];
  codeFlow: string;
}

export const templateRules: TemplateRule[] = [
  {
    id: "ELI_STANDARD_V1",
    classification: "Standard ELI",
    condition: "ELI + standard payoff",
    launchPack: [
      "Application Form",
      "Term Sheet",
      "Related Disclosure",
      "Launch Control Sheet",
    ],
    codeFlow: "Product Code Creation + COPIA + Summit",
  },
  {
    id: "ELI_COMPLEX_V1",
    classification: "Complex ELI",
    condition: "ELI + barrier / knock-in feature",
    launchPack: [
      "Standard Pack",
      "Payoff Illustration",
      "Complex Product Risk Disclosure",
    ],
    codeFlow: "Product Code Creation + COPIA + Summit",
  },
  {
    id: "BOND_CODE_V1",
    classification: "Bond",
    condition: "Product Family = Bond",
    launchPack: [],
    codeFlow: "Bond Code Creation Flow",
  },
  {
    id: "MANUAL_V1",
    classification: "Unsupported",
    condition: "No matching rule or missing key fields",
    launchPack: [],
    codeFlow: "Manual Handling",
  },
];

export function getTemplateRule(id: string): TemplateRule {
  return templateRules.find((rule) => rule.id === id) ?? templateRules[templateRules.length - 1];
}
