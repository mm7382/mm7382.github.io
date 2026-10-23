import Foundation

func localized(_ v: LocalizedText) -> [String: String] { ["zh": v.zhHant, "en": v.enUS] }
func target(_ v: ZiweiLessonTarget) -> [String: Any] {
    switch v {
    case .anyPalaceName: return ["kind": "anyPalaceName"]
    case .soulBranch: return ["kind": "soulBranch"]
    case .majorStarsInSoulPalace: return ["kind": "majorStarsInSoulPalace"]
    case .bodyPalaceName: return ["kind": "bodyPalaceName"]
    case .fiveElements: return ["kind": "fiveElements"]
    case .palaceStars(let name): return ["kind": "palaceStars", "name": name]
    case .oppositeOfSoulPalaceName: return ["kind": "oppositeOfSoulPalaceName"]
    case .fourPositionsPalaceNames: return ["kind": "fourPositionsPalaceNames"]
    case .emptyPalaceNames: return ["kind": "emptyPalaceNames"]
    case .doubleStarPalaceNames: return ["kind": "doubleStarPalaceNames"]
    case .layerSoulPalaceName(let layer): return ["kind": "layerSoulPalaceName", "layer": layer.rawValue]
    case .agePalaceName: return ["kind": "agePalaceName"]
    case .palaceOfStar(let name): return ["kind": "palaceOfStar", "name": name]
    }
}
func diagram(_ v: ZiweiLessonDiagram) -> [String: Any] {
    switch v {
    case .palaces(let names): return ["kind": "palaces", "names": names]
    case .soulAndBody: return ["kind": "soulAndBody"]
    case .soulAndOpposite: return ["kind": "soulAndOpposite"]
    case .fourPositions: return ["kind": "fourPositions"]
    case .emptyPalaces: return ["kind": "emptyPalaces"]
    case .doubleStarPalaces: return ["kind": "doubleStarPalaces"]
    case .timeLayer(let layer): return ["kind": "timeLayer", "layer": layer.rawValue]
    case .agePalace: return ["kind": "agePalace"]
    case .fullChart: return ["kind": "fullChart"]
    case .stars(let names): return ["kind": "stars", "names": names]
    }
}
@main struct ExportZiweiLessons {
    static func main() throws {
        let lessons: [[String: Any]] = ZiweiLessonLibrary.lessons.map { lesson in
            let catalog = ZiweiLearningCatalog.lesson(id: lesson.lessonId)
            var out: [String: Any] = [
                "id": lesson.lessonId, "version": lesson.version,
                "order": catalog?.order ?? 0,
                "title": catalog.map { localized($0.title) } ?? localized(lesson.objective),
                "objective": localized(lesson.objective),
                "sections": lesson.sections.map { ["id": $0.id, "layer": $0.layer.rawValue,
                    "heading": localized($0.heading), "body": localized($0.body)] as [String: Any] },
                "citations": lesson.citations.map { ["original": $0.originalChinese,
                    "translation": $0.englishTranslation, "book": localized($0.bookAndVolume)] as [String: Any] },
                "questions": lesson.questions.map { ["id": $0.id, "prompt": localized($0.prompt),
                    "options": $0.options.map(localized), "correctIndex": $0.correctIndex,
                    "explanation": localized($0.explanation), "teaches": $0.teaches,
                    "evidenceZh": $0.evidenceZh] as [String: Any] },
                "chartTask": ["id": lesson.chartTask.id, "prompt": localized(lesson.chartTask.prompt),
                    "target": target(lesson.chartTask.target), "missingDataNote": localized(lesson.chartTask.missingDataNote)],
                "prerequisites": lesson.prerequisites,
                "reviewStatus": lesson.reviewStatus.rawValue
            ]
            if let question = lesson.lifeQuestion { out["lifeQuestion"] = localized(question) }
            if let image = lesson.diagram { out["diagram"] = diagram(image) }
            if let caption = lesson.diagramCaption { out["diagramCaption"] = localized(caption) }
            if let example = lesson.example { out["example"] = localized(example) }
            return out
        }
        let output: [String: Any] = ["lessons": lessons,
            "teachingExample": ["label": localized(ZiweiTeachingExample.label),
                "birthDate": ZiweiTeachingExample.birthDate,
                "birthTime": ZiweiTeachingExample.birthTime,
                "referenceDate": ZiweiTeachingExample.referenceDate,
                "chart": try JSONSerialization.jsonObject(with: JSONEncoder().encode(ZiweiTeachingExample.chart))],
        ]
        FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject: output, options: [.sortedKeys]))
    }
}
