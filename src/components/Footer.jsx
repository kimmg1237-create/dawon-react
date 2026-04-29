export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-section">
          <h4>다원출판사</h4>
          <p>주소: 서울특별시 (상세 주소)</p>
          <p>이메일: dawon@example.com</p>
          <p>전화: 02-000-0000</p>
        </div>
        <div className="footer-section">
          <h4>SNS</h4>
          <div className="footer-links">
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">YouTube</a>
            <a href="https://blog.naver.com" target="_blank" rel="noopener noreferrer">네이버 블로그</a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">인스타그램</a>
          </div>
        </div>
        <div className="footer-section">
          <p className="copyright">&copy; {new Date().getFullYear()} 다원출판사. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
