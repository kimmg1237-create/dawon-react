export async function extractTextFromHwpFile(file) {
  // 임시: HWP 파싱 기능 비활성화 (배포용)
  // TODO: 서버사이드에서 HWP 파싱 구현
  console.warn('HWP 파싱 기능이 일시적으로 비활성화되었습니다.');
  return 'HWP 파일에서 텍스트를 추출할 수 없습니다. 서버사이드에서 처리해주세요.';
}
