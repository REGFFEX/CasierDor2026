/**
 * 🛠️ Utilitaire de Test des Écrans Tactiles
 * Détecte les anomalies et problèmes sur l'écran tactile
 */

interface TouchScreenDiagnosticsData {
  hasTouchSupport: boolean;
  isDefective: boolean;
  issues: string[];
  fastTapDetected: number; // Nombre de taps < 80ms détectés
  dragIssuesDetected: number; // Nombre de drags involontaires
  longPressIssuesDetected: number; // Nombre de long-press involontaires
  confidence: 'healthy' | 'warning' | 'critical';
  lastTestTime: Date;
}

export type TouchScreenDiagnostics = TouchScreenDiagnosticsData;

class TouchScreenDiagnosticsClass {
  private diagnostics: TouchScreenDiagnostics;
  private tapHistory: number[] = [];
  private dragEvents: Array<{ distance: number; duration: number }> = [];
  private longPressEvents: number[] = [];

  constructor() {
    this.diagnostics = {
      hasTouchSupport: this.checkTouchSupport(),
      isDefective: false,
      issues: [],
      fastTapDetected: 0,
      dragIssuesDetected: 0,
      longPressIssuesDetected: 0,
      confidence: 'healthy',
      lastTestTime: new Date(),
    };
  }

  /**
   * Vérifier si le périphérique supporte le tactile
   */
  private checkTouchSupport(): boolean {
    return (
      typeof window !== 'undefined' &&
      (navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0 ||
        (window as any).ontouchstart !== undefined)
    );
  }

  /**
   * Analyser un événement de tap
   */
  recordTapEvent(timestamp: number): void {
    this.tapHistory.push(timestamp);

    // Garder seulement les 50 derniers taps
    if (this.tapHistory.length > 50) {
      this.tapHistory.shift();
    }

    // Analyser les taps rapides
    if (this.tapHistory.length >= 2) {
      const lastInterval = 
        this.tapHistory[this.tapHistory.length - 1] - 
        this.tapHistory[this.tapHistory.length - 2];

      // < 80ms = trop rapide (peut indiquer un écran défectueux)
      if (lastInterval < 80) {
        this.diagnostics.fastTapDetected++;
        console.warn(`🔴 Fast tap detected: ${lastInterval}ms`);
      }
    }
  }

  /**
   * Analyser un drag involontaire
   */
  recordDragEvent(distance: number, duration: number): void {
    // Drag > 15px en < 200ms = mouvement involontaire ou écran défectueux
    if (distance > 15 && duration < 200) {
      this.dragEvents.push({ distance, duration });
      this.diagnostics.dragIssuesDetected++;
      console.warn(`🔴 Involuntary drag: ${distance}px in ${duration}ms`);
    }
  }

  /**
   * Analyser un long-press involontaire
   */
  recordLongPressEvent(duration: number): void {
    if (duration > 500) {
      this.longPressEvents.push(duration);
      this.diagnostics.longPressIssuesDetected++;
      console.warn(`🔴 Involuntary long-press: ${duration}ms`);
    }
  }

  /**
   * Analyser les statistiques et donner un diagnostic
   */
  runDiagnostics(): TouchScreenDiagnostics {
    this.diagnostics.lastTestTime = new Date();
    this.diagnostics.issues = [];

    // Pas de support tactile
    if (!this.diagnostics.hasTouchSupport) {
      this.diagnostics.issues.push('Aucun support tactile détecté (utilisation clavier/souris)');
      return this.diagnostics;
    }

    // Analyse des fast taps
    if (this.diagnostics.fastTapDetected > 10) {
      this.diagnostics.issues.push(
        `Trop de taps rapides détectés (${this.diagnostics.fastTapDetected} > 10). ` +
        'L\'écran tactile peut être défectueux.'
      );
    }

    // Analyse des drags involontaires
    if (this.diagnostics.dragIssuesDetected > 5) {
      this.diagnostics.issues.push(
        `Plusieurs drags involontaires détectés (${this.diagnostics.dragIssuesDetected} > 5). ` +
        'L\'écran peut avoir un problème de calibration.'
      );
    }

    // Analyse des long-press involontaires
    if (this.diagnostics.longPressIssuesDetected > 5) {
      this.diagnostics.issues.push(
        `Plusieurs long-press involontaires détectés (${this.diagnostics.longPressIssuesDetected} > 5). ` +
        'L\'écran peut être collant ou défectueux.'
      );
    }

    // Déterminer le niveau de confiance
    const totalIssues = 
      this.diagnostics.fastTapDetected + 
      this.diagnostics.dragIssuesDetected + 
      this.diagnostics.longPressIssuesDetected;

    if (totalIssues === 0) {
      this.diagnostics.confidence = 'healthy';
      this.diagnostics.isDefective = false;
    } else if (totalIssues < 10) {
      this.diagnostics.confidence = 'warning';
      this.diagnostics.isDefective = false;
      this.diagnostics.issues.push(
        '⚠️ Quelques anomalies tactiles détectées. ' +
        'L\'écran fonctionne mais peut avoir des problèmes intermittents.'
      );
    } else {
      this.diagnostics.confidence = 'critical';
      this.diagnostics.isDefective = true;
      this.diagnostics.issues.push(
        '🔴 ÉCRAN TACTILE DÉFECTUEUX DÉTECTÉ. ' +
        'Considérez une réparation ou remplacement.'
      );
    }

    return this.diagnostics;
  }

  /**
   * Obtenir le diagnostic actuel
   */
  getDiagnostics(): TouchScreenDiagnostics {
    return { ...this.diagnostics };
  }

  /**
   * Réinitialiser les statistiques
   */
  reset(): void {
    this.tapHistory = [];
    this.dragEvents = [];
    this.longPressEvents = [];
    this.diagnostics = {
      hasTouchSupport: this.checkTouchSupport(),
      isDefective: false,
      issues: [],
      fastTapDetected: 0,
      dragIssuesDetected: 0,
      longPressIssuesDetected: 0,
      confidence: 'healthy',
      lastTestTime: new Date(),
    };
  }

  /**
   * Générer un rapport détaillé
   */
  generateReport(): string {
    const diag = this.runDiagnostics();
    const report = `
╔════════════════════════════════════════════════╗
║         DIAGNOSTIC ÉCRAN TACTILE               ║
╚════════════════════════════════════════════════╝

📊 Résultats:
───────────────────────────────────────────────
• Support tactile:          ${diag.hasTouchSupport ? '✅ OUI' : '❌ NON'}
• État de l'écran:          ${diag.confidence === 'healthy' ? '✅ Sain' : diag.confidence === 'warning' ? '⚠️ Avertissement' : '🔴 Critique'}
• Écran défectueux:         ${diag.isDefective ? '❌ OUI' : '✅ NON'}

📈 Statistiques:
───────────────────────────────────────────────
• Fast taps (< 80ms):       ${diag.fastTapDetected}
• Drags involontaires:      ${diag.dragIssuesDetected}
• Long-press involontaires: ${diag.longPressIssuesDetected}
• Total d'anomalies:        ${diag.fastTapDetected + diag.dragIssuesDetected + diag.longPressIssuesDetected}

⚠️ Problèmes détectés:
───────────────────────────────────────────────
${diag.issues.length > 0 
  ? diag.issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')
  : '✅ Aucun problème détecté'}

🕐 Test effectué: ${diag.lastTestTime.toLocaleString()}
`;
    return report;
  }
}

// Instance globale
export const touchScreenDiagnostics = new TouchScreenDiagnosticsClass();

// Export de la classe pour tests/extension
export default TouchScreenDiagnosticsClass;
