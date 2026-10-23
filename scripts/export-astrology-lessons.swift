import Foundation

// Compile alongside the original, read-only lesson files. These tiny types
// provide only the vocabulary the content catalog needs, without app services.
enum L10n { static let contentLocale = "zh-Hant" }
public enum CelestialBody: String, Sendable { case sun, moon, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto }
public enum AspectKind: String, Sendable { case conjunction, sextile, square, trine, opposition }

func t(_ value: LocalizedText) -> [String: String] {
    ["zh": value.zhHant, "en": value.en]
}
func observation(_ value: LessonObservation) -> [String: Any] {
    switch value {
    case .luminariesAndAscendant: return ["kind": "luminariesAndAscendant"]
    case .bodies(let bodies): return ["kind": "bodies", "bodies": bodies.map(\.rawValue)]
    case .houses(let houses): return ["kind": "houses", "houses": houses]
    case .aspects(let kinds): return ["kind": "aspects", "kinds": kinds.map(\.rawValue)]
    case .retrogrades: return ["kind": "retrogrades"]
    case .lunarPhase: return ["kind": "lunarPhase"]
    case .elementBalance: return ["kind": "elementBalance"]
    case .noChartData: return ["kind": "noChartData"]
    }
}

@main struct ExportAstrologyLessons {
    static func main() throws {
        let problems = LessonCatalog.validationProblems()
        guard problems.isEmpty else {
            fputs("Native lesson validation failed: \(problems.joined(separator: "; "))\n", stderr)
            exit(1)
        }
        let catalog = LessonCatalog.all
        guard catalog.count == 36, catalog.allSatisfy(LessonCatalog.isPublishable) else {
            fputs("All 36 lessons must pass the native publication gate.\n", stderr)
            exit(1)
        }
        let lessons: [[String: Any]] = catalog.map { lesson in
            let content = lesson.content!
            let concepts: [[String: Any]] = content.concepts.map { block in
                ["id": block.sectionId, "index": block.index,
                 "heading": t(block.heading), "kicker": t(block.kicker),
                 "paragraphs": block.paragraphs.map { paragraph in
                    ["text": t(paragraph.text), "supports": paragraph.supports.map(\.rawValue)] as [String: Any]
                 }] as [String: Any]
            }
            let sources: [[String: Any]] = content.sources.map { source in
                ["title": t(source.title), "detail": t(source.detail),
                 "rights": t(source.rights), "retrieved": source.retrieved,
                 "links": source.links.map { ["label": t($0.label), "url": $0.url] }] as [String: Any]
            }
            let quizzes: [[String: Any]] = content.quiz.map { quiz in
                ["id": quiz.id, "prompt": t(quiz.prompt),
                 "options": quiz.options.map { ["text": t($0.text), "correct": $0.isCorrect,
                                              "reason": t($0.reason)] }] as [String: Any]
            }
            var out: [String: Any] = [
                "id": lesson.id, "number": lesson.number, "track": lesson.track.rawValue,
                "title": t(lesson.title), "revision": content.revision,
                "objective": t(content.objective), "summary": t(content.summary),
                "concepts": concepts, "example": ["label": t(content.example.label),
                    "lines": content.example.lines.map(t), "caveat": t(content.example.caveat)],
                "personalIntro": t(content.personalIntro), "personalSteps": content.personalSteps.map(t),
                "observation": observation(content.observation),
                "misconceptions": content.misconceptions.map { ["claim": t($0.claim), "correction": t($0.correction)] },
                "quiz": quizzes, "notePrompt": t(content.notePrompt), "sources": sources,
                "limitations": content.limitations.map(t), "sourceGaps": content.sourceGaps.map(t)
            ]
            if let diagram = content.diagram {
                out["diagram"] = ["kind": diagram.kind.rawValue,
                                  "caption": t(diagram.caption), "alt": t(diagram.alt)]
            }
            return out
        }
        let data = try JSONSerialization.data(withJSONObject: ["schemaVersion": LessonLibrary.schemaVersion,
                                                                "lessons": lessons], options: [.sortedKeys])
        FileHandle.standardOutput.write(data)
    }
}
