document.addEventListener('DOMContentLoaded', function() {
  const tabList = document.getElementById('tab-list');
  const addTabButton = document.getElementById('add-tab');
  const newTabNameInput = document.getElementById('new-tab-name');
  const deleteNoteButton = document.getElementById('delete-note');
  const note = document.getElementById('note');

  const lienList = document.getElementById('lien-list');
  const addLienButton = document.getElementById('add-lien');
  const newLienNameInput = document.getElementById('new-lien-name');
  const liensButton = document.getElementById('liens');
  let activeTab = null;
  let liensVisible = false;

  // Charge les notes onglets
  chrome.storage.sync.get(['tabs', 'activeTab', 'tabLien'], function(result) {
      const tabs = result.tabs || [];
      const tabLien = result.tabLien || [];
      activeTab = result.activeTab || null;

      tabs.forEach(tab => createTabElement(tab, 'tab'));
      tabLien.forEach(lien => createTabElement(lien, 'lien'));

      if (activeTab) {
          switchTab(activeTab);
          loadNoteForTab(activeTab);
      }
  });

  // Création d'onglet
  addTabButton.addEventListener('click', function() {
      const newTabName = newTabNameInput.value.trim();
      if (newTabName) {
          chrome.storage.sync.get(['tabs'], function(result) {
              const tabs = result.tabs || [];
              tabs.push(newTabName);
              chrome.storage.sync.set({ tabs: tabs, activeTab: newTabName }, function() {
                  createTabElement(newTabName, 'tab');
                  switchTab(newTabName);
                  newTabNameInput.value = '';
              });
          });
      }
  });

  // Vérification de la validité d'un lien (https/.com etc...)
  function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;  
    }
  }

  // Création d'un lien
  addLienButton.addEventListener('click', function() {
      const newLienName = newLienNameInput.value.trim();
      if (newLienName && isValidURL(newLienName)) {
          chrome.storage.sync.get(['tabLien'], function(result) {
              const tabLien = result.tabLien || [];
              tabLien.push(newLienName);
              chrome.storage.sync.set({ tabLien: tabLien, activeTab: newLienName }, function() {
                  createTabElement(newLienName, 'lien');
                  switchTab(newLienName);
                  newLienNameInput.value = '';
              });
          });
      } else {
          alert("Veuillez entrer un lien valide.");
      }
  });

  // Suppression du contenu de la note et de l'onglet
  deleteNoteButton.addEventListener('click', function() {
      if (activeTab) {
          chrome.storage.sync.get(['tabs'], function(result) {
              let tabs = result.tabs || [];
              tabs = tabs.filter(tab => tab !== activeTab);
              chrome.storage.sync.remove([activeTab], function() {
                  chrome.storage.sync.set({ tabs: tabs, activeTab: null }, function() {
                      note.value = ''; // Clear the note content from the textarea
                      const tabToRemove = document.querySelector(`.tab[data-tab="${activeTab}"]`);
                      if (tabToRemove) {
                          tabToRemove.remove();
                      }
                      activeTab = null;
                      console.log('Note and corresponding tab deleted successfully');
                  });
              });
          });
      }
  });

  // Creation du DOM pour les notes et les liens
  function createTabElement(name, type) {
      const element = document.createElement('div');
      element.className = type;
      element.setAttribute('data-tab', name);

      const elementName = document.createElement('span');
      if (type === 'lien') {
          const link = document.createElement('a');
          link.href = name;
          link.textContent = name;
          link.target = '_blank';
          link.className = 'element-name';
          elementName.appendChild(link);
      } else {
          elementName.textContent = name;
          elementName.className = 'element-name';
          elementName.addEventListener('click', () => switchTab(name));
      }
      element.appendChild(elementName);

      if (type === 'lien') {
          const deleteButton = document.createElement('button');
          deleteButton.textContent = 'Delete';
          deleteButton.className = 'delete-button';
          deleteButton.addEventListener('click', () => deleteLien(name));
          element.appendChild(deleteButton);
      }

      if (type === 'tab') {
          tabList.appendChild(element);
      } else {
          lienList.appendChild(element);
      }
  }

  // Switch de note
  function switchTab(tabName) {
      activeTab = tabName;
      chrome.storage.sync.set({ activeTab: tabName });
      loadNoteForTab(tabName);

      const tabs = document.querySelectorAll('.tab, .lien');
      tabs.forEach(tab => {
          tab.classList.remove('active');
      });

      const clickedTab = document.querySelector(`.tab[data-tab="${tabName}"], .lien[data-tab="${tabName}"]`);
      if (clickedTab) {
          clickedTab.classList.add('active');
      }
  }

  // Chargement de la note spécifique à l'onglet
  function loadNoteForTab(tabName) {
      chrome.storage.sync.get([tabName], function(result) {
          note.value = result[tabName] || '';
      });
  }

  // Sauvegarde auto lors de l'écriture de la note
  note.addEventListener('input', function() {
      if (activeTab) {
          const noteContent = note.value;
          chrome.storage.sync.set({ [activeTab]: noteContent }, function() {
              console.log('Note saved automatically');
          });
      }
  });

  // Suppression d'un lien
  function deleteLien(lienName) {
      chrome.storage.sync.get(['tabLien'], function(result) {
          let tabLien = result.tabLien || [];
          tabLien = tabLien.filter(lien => lien !== lienName);
          chrome.storage.sync.set({ tabLien: tabLien }, function() {
              const lienToRemove = document.querySelector(`.lien[data-tab="${lienName}"]`);
              if (lienToRemove) {
                  lienToRemove.remove();
              }
              console.log('Lien deleted successfully');
          });
      });
  }

  // Afficher les liens
  liensButton.addEventListener('click', function() {
      liensVisible = !liensVisible;
      lienList.style.display = liensVisible ? 'block' : 'none';
  });
});
