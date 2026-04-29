import { useState } from 'react';
import { supabase } from '../../supabase';
import { extractTextFromHwpFile } from '../../utils/hwpText';
import { buildStoragePath, resolveMimeType } from '../../utils/mimeType';

export default function BookUploader({ onUploaded }) {
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [hwpFile, setHwpFile] = useState(null);
  const [hwpFilename, setHwpFilename] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleTextFileSelect = async (file) => {
    setHwpFile(file);
    setHwpFilename(file.name);

    // .txt 파일은 즉시 본문 자동 채우기
    if (file.name.toLowerCase().endsWith('.txt')) {
      try {
        const text = await file.text();
        setTextContent(text);
        setMessage('TXT 파일 본문을 자동으로 불러왔습니다.');
      } catch {
        setMessage('TXT 읽기에 실패했습니다.');
      }
    } else if (file.name.toLowerCase().endsWith('.hwp')) {
      try {
        const parsed = await extractTextFromHwpFile(file);
        if (parsed.trim()) {
          setTextContent(parsed);
          setMessage('HWP 파일 본문을 자동 추출했습니다.');
        } else {
          setMessage('HWP 파일에서 본문을 찾지 못했습니다. 직접 입력해주세요.');
        }
      } catch (e) {
        setMessage('HWP 자동 추출 실패: ' + (e?.message || '파싱 오류'));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !textContent.trim()) { setMessage('제목과 텍스트를 입력해주세요.'); return; }
    setUploading(true);
    setMessage('');

    try {
      let coverUrl = '';
      let uploadedHwpFilename = hwpFilename || '';

      if (hwpFile) {
        const path = buildStoragePath('audiobook-hwp', hwpFile);
        const { error: hwpErr } = await supabase.storage
          .from('public-assets')
          .upload(path, hwpFile, { contentType: resolveMimeType(hwpFile) });
        if (hwpErr) {
          throw new Error(`한글 파일 업로드 실패 (권한/RLS 확인): ${hwpErr.message}`);
        }
        uploadedHwpFilename = hwpFile.name;
      }

      if (coverFile) {
        const path = buildStoragePath('audiobook-covers', coverFile);
        const { error: upErr } = await supabase.storage
          .from('public-assets')
          .upload(path, coverFile, { contentType: resolveMimeType(coverFile) });
        if (upErr) {
          throw new Error(`스토리지 업로드 실패 (권한/RLS 확인): ${upErr.message}`);
        }
        const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(path);
        coverUrl = urlData.publicUrl;
      }

      const paragraphs = textContent.split('\n').filter(p => p.trim());
      const { error } = await supabase.from('audiobooks').insert({
        title,
        hwp_filename: uploadedHwpFilename,
        text_cache: textContent,
        paragraphs_cache: paragraphs,
        cover_url: coverUrl,
      });
      if (error) {
        throw new Error(`오디오북 DB 저장 실패 (audiobooks RLS 확인): ${error.message}`);
      }

      setMessage('업로드 성공!');
      setTitle('');
      setTextContent('');
      setCoverFile(null);
      setHwpFile(null);
      setHwpFilename('');
      if (onUploaded) onUploaded();
    } catch (err) {
      setMessage('업로드 실패: ' + err.message);
    }
    setUploading(false);
  };

  return (
    <div className="book-uploader">
      <h3>도서 업로드 (관리자)</h3>
      <form onSubmit={handleSubmit}>
        <input placeholder="도서 제목" value={title} onChange={e => setTitle(e.target.value)} required />
        <label>한글 파일 업로드 (.hwp 또는 .txt):
          <input
            type="file"
            accept=".hwp,.txt,text/plain"
            onChange={e => e.target.files[0] && handleTextFileSelect(e.target.files[0])}
          />
        </label>
        <input placeholder="한글 파일명" value={hwpFilename} onChange={e => setHwpFilename(e.target.value)} />
        <textarea placeholder="도서 텍스트 (줄바꿈으로 문단 구분)" rows={8} value={textContent} onChange={e => setTextContent(e.target.value)} required />
        <label>커버 이미지 (선택):
          <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files[0])} />
        </label>
        <button type="submit" className="btn-primary" disabled={uploading}>
          {uploading ? '업로드 중...' : '업로드'}
        </button>
      </form>
      {message && <p className="upload-msg">{message}</p>}
    </div>
  );
}
