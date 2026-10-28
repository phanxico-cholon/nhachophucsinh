// Link Google Sheet công khai định dạng CSV của Nhà Chờ Phục Sinh
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQDqsKXut4tys4GoS-D19eQ_hthJIhLXxX8a6_neYoavoIOpbMgnHPOH8wlvSO-N783DrjUZfWRCPYc/pub?gid=1625617362&single=true&output=csv';

let allData = [];

window.addEventListener('DOMContentLoaded', () => {
  Papa.parse(csvUrl, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      allData = results.data;
      document.getElementById('loading').style.display = 'none';
      displayData(allData);
    },
    error: function(err) {
      document.getElementById('loading').innerHTML = '<span style="color: red;">Không thể tải dữ liệu từ Nhà chờ Phục Sinh. Vui lòng kiểm tra lại liên kết!</span>';
    }
  });
});

// Hàm hỗ trợ bỏ dấu tiếng Việt để tìm kiếm không dấu
function removeAccents(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

// Hiển thị danh sách kết quả dạng thẻ (card) gọn gàng, trang nghiêm
function displayData(data) {
  const grid = document.getElementById('resultsGrid');
  const countEl = document.getElementById('recordCount');
  grid.innerHTML = '';

  countEl.innerText = `Tìm thấy ${data.length} kết quả`;

  if (data.length === 0) {
    grid.innerHTML = '<p style="text-align: center; color: #777; padding: 2rem; grid-column: 1/-1;">Không tìm thấy thông tin phù hợp.</p>';
    return;
  }

  data.forEach(item => {
    const tenThanh = item['tenThanh'] || '';
    const hoTen = item['hoTen'] || '';
    const ngaySinh = item['ngaySinh'] || '';
    const ngayMat = item['ngayMat'] || '';
    const ngayGioDuong = item['ngayGioDuong'] || '';
    const khu = item['khu'] || '';
    const day = item['day'] || '';
    const soHoc = item['soHoc'] || '';
    const ghichu = item['ghichu'] || '';

    let locationParts = [];
    if (khu) locationParts.push(`Lô ${khu}`);
    if (day) locationParts.push(`Tầng ${day}`);
    if (soHoc) locationParts.push(`Ngăn ${soHoc}`);
    const locationText = locationParts.join(' - ') || 'Chưa định vị';

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-info">
        <div class="saint-name">${tenThanh}</div>
        <div class="full-name">${hoTen}</div>
        <div class="card-details">
          ${(ngaySinh || ngayMat) ? `<span>📅 Sinh-Mất: <strong>${ngaySinh || '?'} – ${ngayMat || '?'}</strong></span>` : ''}
          ${ngayGioDuong ? `<span>🕯️ Ngày giỗ: <strong>${ngayGioDuong}</strong></span>` : ''}
          ${ghichu ? `<span style="width: 100%; font-style: italic; color: #555;">📝 Ghi chú: ${ghichu}</span>` : ''}
        </div>
      </div>
      <div class="location-badge">
        📍 Vị trí<br>${locationText}
      </div>
    `;
    grid.appendChild(card);
  });
}

// Lọc dữ liệu theo từ khóa tìm kiếm
function filterData() {
  const rawQuery = document.getElementById('searchInput').value.trim();
  const query = removeAccents(rawQuery.toLowerCase());
  
  if (!query) {
    displayData(allData);
    return;
  }

  const filtered = allData.filter(item => {
    return Object.values(item).some(val => {
      if (!val) return false;
      const strVal = String(val);
      return strVal.toLowerCase().includes(rawQuery.toLowerCase()) || 
             removeAccents(strVal.toLowerCase()).includes(query);
    });
  });

  displayData(filtered);
}
