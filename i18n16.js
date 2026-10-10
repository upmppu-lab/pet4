// 사용자 그림 캐릭터(PNG) 커스터마이징 탭 번역
Object.assign(I18N.ko, {
 ct_pngchar:'내그림', pngHint:'캐릭터의 스타일을 고르세요!',
 pngFaceL:'얼굴', pngHairL:'헤어', pngTopL:'상의', pngBottomL:'하의',
 myPic:'내 사진', accBtnL:'소품', accEmptyHint:'아직 소품이 없어요. 위의 📁+ 버튼으로 소품 그림을 추가해보세요!',
 colorHueL:'색상',
 dirFrontL:'정면', dirBackL:'뒷면', dirSideL:'옆면', dirDiagL:'대각선', rotateHint:'회전',
 importHint:'내가 그린 그림 불러오기', pngImportOk:'추가했어요!', importFail2:'그림을 불러오지 못했어요',
});
Object.assign(I18N.ru, {
 ct_pngchar:'Мой рисунок', pngHint:'Выберите стиль персонажа!',
 pngFaceL:'Лицо', pngHairL:'Причёска', pngTopL:'Верх', pngBottomL:'Низ',
 myPic:'Моё фото', accBtnL:'Аксессуар', accEmptyHint:'Пока нет аксессуаров. Нажмите 📁+ выше, чтобы добавить свой рисунок!',
 colorHueL:'Цвет',
 dirFrontL:'Спереди', dirBackL:'Сзади', dirSideL:'Сбоку', dirDiagL:'По диагонали', rotateHint:'Повернуть',
 importHint:'Загрузить свой рисунок', pngImportOk:'Добавлено!', importFail2:'Не удалось загрузить картинку',
});
for (let i = 1; i <= 15; i++) {
  I18N.ko['pngFace' + i] = '얼굴 ' + i;
  I18N.ko['pngHair' + i] = '헤어 ' + i;
  I18N.ko['pngTop' + i] = '상의 ' + i;
  I18N.ko['pngBottom' + i] = '하의 ' + i;
  I18N.ru['pngFace' + i] = 'Лицо ' + i;
  I18N.ru['pngHair' + i] = 'Причёска ' + i;
  I18N.ru['pngTop' + i] = 'Верх ' + i;
  I18N.ru['pngBottom' + i] = 'Низ ' + i;
}
// 캐릭터 파츠/색상 해금 문구
Object.assign(I18N.ko, {
  locked: '레벨 {n}에 해금',
  unlockAt: '🔒 Lv{n}에 해금',
});
Object.assign(I18N.ru, {
  locked: 'Откроется на уровне {n}',
  unlockAt: '🔒 Ур.{n}',
});