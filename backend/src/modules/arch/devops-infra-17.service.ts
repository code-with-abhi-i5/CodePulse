/**
 * Architecture Service: Prometheus Alerting Rule Validator
 * Subsystem: Advanced DevOps & Infrastructure Automation [DEVOPS-INFRA-17]
 */

export interface PrometheusAlertRule {
  alert: string;
  expr: string;
  forDuration: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
}

export class PrometheusAlertValidatorService {
  public validateRuleSyntax(rule: PrometheusAlertRule): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rule.alert || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(rule.alert)) {
      errors.push('Invalid alert name: must be a valid Prometheus identifier');
    }
    if (!rule.expr || rule.expr.trim().length === 0) {
      errors.push('Missing alert expression (expr)');
    }
    if (!rule.forDuration || !/^\d+[smhd]$/.test(rule.forDuration)) {
      errors.push('Invalid for duration format (e.g. 5m, 1h)');
    }
    if (!rule.labels || !rule.labels.severity) {
      errors.push('Alert rule must include a severity label (e.g. critical, warning)');
    }
    if (!rule.annotations || !rule.annotations.summary) {
      errors.push('Alert rule must include a summary annotation');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public evaluateThreshold(expr: string, metricValue: number): boolean {
    const match = expr.match(/(>|<|>=|<=|==|!=)\s*([0-9.]+)/);
    if (!match) return false;

    const op = match[1];
    const threshold = parseFloat(match[2]);

    switch (op) {
      case '>': return metricValue > threshold;
      case '<': return metricValue < threshold;
      case '>=': return metricValue >= threshold;
      case '<=': return metricValue <= threshold;
      case '==': return metricValue === threshold;
      case '!=': return metricValue !== threshold;
      default: return false;
    }
  }
}
