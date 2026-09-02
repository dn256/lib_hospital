import type { IhcMarkerCatalogEntry } from './ihcMarkerCatalog'
import { markerEvidenceFor } from './ihcMarkerEvidence'
import { panelsForMarker } from './ihcMarkerPanels'

export interface IhcMarkerFoundation {
  localization: string
  positive: string
  negative: string
  control: string
  indications: string[]
  pitfalls: string[]
  curated: boolean
  evidenceLabel?: string
}

const nuclear = new Set([
  'BAP1', 'Bcl-6', 'C-MYC', 'CDX2', 'CyD1', 'ER', 'ERG', 'GATA3', 'INSM1', 'Ki67',
  'MLH1', 'MSH2', 'MSH6', 'MUM1', 'NKX3.1', 'OCT3/4', 'p40', 'p53', 'p57', 'p63',
  'PAX2', 'PAX5', 'PAX8', 'PMS2', 'PR', 'PRAME', 'SALL4', 'SATB2', 'Smad4', 'SOX10', 'SOX11',
  'TdT', 'TRPS1', 'TTF1', 'WT1',
])

const membrane = new Set([
  'CA125', 'CD10', 'CD117', 'CD138', 'CD14', 'CD19', 'CD20', 'CD23', 'CD3', 'CD30', 'CD31',
  'CD34', 'CD4', 'CD45', 'CD5', 'CD56', 'CD8', 'CD99', 'CLDN18.2', 'CLDN4', 'ECAD', 'EpCAM',
  'FOLR1', 'HER2 IHC', 'PD-L1 (IC)', 'PD-L1 (TPS/CPS)', 'Podop', 'URO II/III',
])

const nuclearCytoplasmic = new Set(['CALRET', 'p16', 'S100'])
const membraneCytoplasmic = new Set(['CD15', 'CD163', 'CD79a', 'CEA', 'DOG1', 'EMA'])

const localizationFor = (name: string) => {
  if (name === 'ALK (lung)') return 'Bào tương; tín hiệu dương tính của assay ALK phổi phải theo đúng hướng dẫn clone và nền tảng đã thẩm định'
  if (nuclearCytoplasmic.has(name)) return name === 'ALK (lung)' ? 'Bào tương dạng hạt; một số thực thể ALK khác có thể có kiểu nhân/bào tương tùy protein dung hợp' : 'Nhân và/hoặc bào tương theo marker và loại tế bào'
  if (membraneCytoplasmic.has(name)) return 'Màng và/hoặc bào tương; chỉ đọc kiểu phù hợp với marker'
  if (nuclear.has(name)) return 'Nhân'
  if (membrane.has(name)) return 'Màng tế bào'
  if (name === 'HER2 ISH') return 'Tín hiệu gen trong nhân bằng ISH, không phải bắt màu HMMD'
  return 'Bào tương'
}

const lossMarkers = new Set(['BAP1', 'ECAD', 'MLH1', 'MSH2', 'MSH6', 'PMS2', 'Smad4', 'p57'])
const predictiveMarkers = new Set(['ALK (lung)', 'BRAF', 'CLDN18.2', 'FOLR1', 'HER2 IHC', 'HER2 ISH', 'PD-L1 (IC)', 'PD-L1 (TPS/CPS)'])
const proportionMarkers = new Set(['ER', 'PR', 'Ki67', 'HER2 IHC', 'PD-L1 (IC)', 'PD-L1 (TPS/CPS)', 'FOLR1', 'CLDN18.2'])

export const markerFoundation = (entry: IhcMarkerCatalogEntry): IhcMarkerFoundation => {
  const evidence = markerEvidenceFor(entry.name)
  const panels = panelsForMarker(entry.name)
  const indications = panels.map(item => {
    const member = item.members.find(candidate => candidate.marker === entry.name)
    return `${item.question}: ${member?.role || 'diễn giải trong panel'}. ${item.rationale}`
  })
  const localization = localizationFor(entry.name)

  if (evidence) {
    return {
      localization: evidence.localization,
      positive: evidence.positive,
      negative: evidence.negative,
      control: evidence.control,
      indications: evidence.indications,
      pitfalls: evidence.pitfalls,
      curated: true,
      evidenceLabel: evidence.evidenceLabel,
    }
  }

  let positive = `Chỉ ghi nhận tín hiệu ở ${localization.toLocaleLowerCase('vi')} của đúng quần thể tế bào cần đánh giá. Ý nghĩa dương tính phụ thuộc hình thái và vai trò của ${entry.name} trong từng panel bên dưới; một marker đơn độc không xác lập chẩn đoán.`
  let negative = `Không thấy tín hiệu chỉ có giá trị khi mô u còn đầy đủ, nền đạt và chứng nội/ngoại phù hợp. Âm tính không loại trừ thực thể có độ nhạy không tuyệt đối và cần được đọc cùng các marker bổ trợ.`

  if (lossMarkers.has(entry.name)) {
    positive = `Biểu hiện bảo tồn ở ${localization.toLocaleLowerCase('vi')} phải được so với chứng nội. Với marker kiểu “mất biểu hiện”, chính sự mất tín hiệu trong tế bào u khi chứng nội còn dương mới có thể mang ý nghĩa chẩn đoán.`
    negative = `Mất biểu hiện chỉ được chấp nhận khi tế bào không u/chứng nội bắt màu đạt. Mất khu trú, không đồng nhất hoặc nền yếu cần lặp lại, đổi block hay xác nhận bằng phương pháp khác tùy bối cảnh.`
  }

  if (predictiveMarkers.has(entry.name)) {
    positive = `Kết quả dương tính phải được xác định bằng đúng clone/probe, nền tảng, loại bệnh phẩm, thuật toán và ngưỡng đã thẩm định cho chỉ định cụ thể. Không chuyển ngưỡng giữa cơ quan hoặc assay.`
    negative = `Kết quả âm tính chỉ hợp lệ khi tiêu bản và chứng đạt. Một kết quả sát ngưỡng, không đồng nhất hoặc không phù hợp lâm sàng-hình thái cần được xử lý theo hướng dẫn assay, có thể gồm lặp lại hoặc xét nghiệm phản xạ.`
  }

  if (entry.name === 'HER2 ISH') {
    positive = 'Đánh giá khuếch đại ERBB2 bằng số tín hiệu và/hoặc tỷ số theo thuật toán dành cho cơ quan và probe đã thẩm định; đây không phải kết quả bắt màu protein.'
    negative = 'Không khuếch đại chỉ được kết luận khi chất lượng tín hiệu và số nhân đếm đạt yêu cầu; trường hợp biên hoặc không đồng nhất phải xử lý theo guideline của cơ quan.'
  }

  const pitfalls = [
    `Không dùng ${entry.name} đơn độc để kết luận nguồn gốc hoặc bản chất tổn thương.`,
    'Cần ghi clone/assay, vị trí bắt màu, cường độ, tỷ lệ và quần thể tế bào được đọc khi các yếu tố này ảnh hưởng kết luận.',
  ]
  if (proportionMarkers.has(entry.name)) pitfalls.push('Không dùng một ngưỡng phần trăm chung cho mọi cơ quan; phải theo thuật toán của chỉ định hiện hành.')
  if (lossMarkers.has(entry.name)) pitfalls.push('Chứng nội dương là điều kiện bắt buộc trước khi gọi “mất biểu hiện”.')

  return {
    localization,
    positive,
    negative,
    control: `Dùng chứng dương và âm phù hợp trong cùng lần nhuộm. Mở báo cáo ${entry.latestAssessment} của NordiQC bên dưới để xem mô chứng quan trọng và các kiểu nhuộm không đạt của chính marker này.`,
    indications: indications.length ? indications : ['Chỉ định theo hình thái và câu hỏi chẩn đoán cụ thể; đối chiếu trực tiếp tài liệu nguồn trước khi đưa vào panel.'],
    pitfalls,
    curated: false,
  }
}
