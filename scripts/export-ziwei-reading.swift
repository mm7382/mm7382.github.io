import Foundation

func local(_ value: LocalizedText) -> [String: String] { ["zh": value.zhHant, "en": value.enUS] }
func cite(_ value: ZiweiClassicalCitation) -> [String: Any] {
    ["original": value.originalChinese, "translation": value.englishTranslation, "book": local(value.bookAndVolume)]
}

@main struct ExportZiweiReading {
    static func main() throws {
        let kinds = Dictionary(uniqueKeysWithValues: ZiweiAnalysisKind.allCases.map {
            ($0.rawValue, ["title": local(ZiweiReadingCopy.title($0)), "summary": local(ZiweiReadingCopy.summary($0))])
        })
        let topics = Dictionary(uniqueKeysWithValues: ZiweiTopic.allCases.map {
            ($0.rawValue, ["name": local(ZiweiReadingCopy.topic($0)), "context": local(ZiweiGuidedCopy.context($0))])
        })
        let copy: [String: LocalizedText] = [
            "conclusion": ZiweiReadingCopy.conclusion, "stars": ZiweiReadingCopy.stars,
            "noStars": ZiweiReadingCopy.noStars, "basisNatal": ZiweiReadingCopy.basisNatal,
            "basisYearly": ZiweiReadingCopy.basisYearly, "basisMonthly": ZiweiReadingCopy.basisMonthly,
            "basisDecadal": ZiweiReadingCopy.basisDecadal, "life": ZiweiReadingCopy.life,
            "limits": ZiweiReadingCopy.limits, "leapNote": ZiweiReadingCopy.leapNote,
            "unavailable": ZiweiReadingCopy.unavailable,
            "sourcesHeading": ZiweiReadingCopy.sourcesHeading,
            "natalTriadHeading": ZiweiReadingCopy.natalTriadHeading,
            "natalBody": ZiweiReadingCopy.natalBody, "natalFive": ZiweiReadingCopy.natalFive,
            "ruleVersionLine": ZiweiReadingCopy.ruleVersionLine,
            "todayHeading": ZiweiReadingCopy.todayHeading,
            "todayDay": ZiweiReadingCopy.todayDay, "dayLine": ZiweiReadingCopy.dayLine,
            "decadalSourceNote": ZiweiReadingCopy.decadalSourceNote,
            "guidedNote": ZiweiGuidedCopy.note, "empty": ZiweiGuidedCopy.empty,
            "opposite": ZiweiGuidedCopy.opposite, "practice": ZiweiGuidedCopy.practice,
            "layersHeading": ZiweiGuidedCopy.layersHeading,
            "layersNote": ZiweiGuidedCopy.layersNote,
            "methodNote": ZiweiGuidedCopy.methodNote,
            "pairUnreviewed": ZiweiPairReadings.unreviewed,
        ]
        let guides = Dictionary(uniqueKeysWithValues: ZiweiGuidedCopy.stars.map {
            ($0.name, ["theme": local($0.theme), "explanation": local($0.explanation),
                       "example": local($0.example), "practice": local($0.practice)])
        })
        let examples = ZiweiTopicExamples.entries.mapValues { ["example": local($0.example), "action": local($0.action)] }
        let palaceGuides = Dictionary(uniqueKeysWithValues: ZiweiPalaceGuide.entries.map {
            ($0.palaceZhHant, ["gloss": local($0.gloss), "lesson": $0.lessonId] as [String: Any])
        })
        let cultures = Dictionary(uniqueKeysWithValues: ZiweiStarCultureTable.entries.map {
            ($0.starZhHant, ["citation": cite($0.citation), "plain": local($0.plain)] as [String: Any])
        })
        let namePalaces = Dictionary(uniqueKeysWithValues: ZiweiChartNames.palaces.map { ($0.zhHant, $0.short) })
        let nameStars = Dictionary(uniqueKeysWithValues: ZiweiChartNames.stars.map { ($0.zhHant, $0.short) })
        let result: [String: Any] = [
            "kinds": kinds, "topics": topics, "copy": copy.mapValues(local),
            "layers": Dictionary(uniqueKeysWithValues: ZiweiReadingLayer.allCases.map { ($0.rawValue, local(ZiweiReadingCopy.layer($0))) }),
            "guides": guides, "examples": examples, "palaceGuides": palaceGuides,
            "cultures": cultures, "pairs": ZiweiPairReadings.entries.mapValues(local),
            "names": ["palaces": namePalaces, "stars": nameStars],
            "yearlySource": cite(ZiweiReadingCopy.yearlySource),
            "monthlySource": cite(ZiweiReadingCopy.monthlySource),
        ]
        let bytes = try JSONSerialization.data(withJSONObject: result, options: [.sortedKeys, .prettyPrinted])
        FileHandle.standardOutput.write(bytes)
    }
}
