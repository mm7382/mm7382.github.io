import Foundation
// Presentation-only bundle shim. Engine sources are compiled unmodified.
extension Bundle { static var appLanguage: Bundle { .main } }
@main struct Oracle {
 static func main() throws {
  var results: [[String: Any]] = []
  for n in 0..<4096 {
   let values = (0..<6).map { 6 + ((n >> ($0 * 2)) & 3) }
   let r = CastingResult(lineValues: values)
   let reading = r.zhuXiReading
   var name = ""; var indices: [Int] = []
   switch reading.kind {
   case .baseHexagramJudgment: name = "baseHexagramJudgment"
   case .baseHexagramLine(let i): name = "baseHexagramLine"; indices = [i]
   case .baseHexagramTwoLines(let p, let s): name = "baseHexagramTwoLines"; indices = [p,s]
   case .bothHexagramJudgments: name = "bothHexagramJudgments"
   case .changedHexagramTwoLines(let p, let s): name = "changedHexagramTwoLines"; indices = [p,s]
   case .changedHexagramLine(let i): name = "changedHexagramLine"; indices = [i]
   case .useNineOrSix: name = "useNineOrSix"
   case .changedHexagramJudgment: name = "changedHexagramJudgment"
   }
   results.append(["lineValues":values,"hexagramNumber":r.hexagramNumber,"changedHexagramNumber":r.changedHexagramNumber,"movingLineIndices":r.movingLineIndices,"reading":["kind":name,"primaryHexagramNumber":reading.primaryHexagramNumber,"secondaryHexagramNumber":reading.secondaryHexagramNumber,"indices":indices,"ruleName":reading.ruleName]])
  }
  let data = try JSONSerialization.data(withJSONObject:results,options:[.sortedKeys])
  FileHandle.standardOutput.write(data)
 }
}
