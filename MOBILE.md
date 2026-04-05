# Guia de Geração do APK - Comissionamento VC

Este projeto utiliza **Capacitor** para converter a aplicação web em um aplicativo Android nativo.

## Pré-requisitos

1. **Node.js** instalado.
2. **Android Studio** instalado e configurado.
3. **SDK do Android** (nível 30 ou superior recomendado).

## Passo a Passo para Gerar o APK

### 1. Preparar o projeto
Certifique-se de que todas as dependências estão instaladas e o build da web está atualizado:

```bash
npm install
npm run build
npx cap sync
```

### 2. Abrir no Android Studio
O Capacitor criou uma pasta chamada `android`. Abra-a no Android Studio:

```bash
npx cap open android
```
*(Ou abra o Android Studio e selecione a pasta `android` do projeto)*

### 3. Gerar o APK no Android Studio
Dentro do Android Studio:

1. Espere o Gradle sincronizar (barra de progresso na parte inferior).
2. No menu superior, vá em **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3. Quando terminar, uma notificação aparecerá no canto inferior direito. Clique em **locate** para encontrar o arquivo `app-debug.apk`.

### 4. Instalar no Celular
1. Transfira o arquivo `.apk` para o seu celular.
2. No celular, permita a "Instalação de fontes desconhecidas" se solicitado.
3. Instale e abra o app.

### Opção B: Build Automática pelo GitHub

Este projeto já possui um **Workflow do GitHub Actions** configurado para gerar o APK automaticamente em cada `push` para as branches `main` ou `master`.

1. Faça o **Push** das suas alterações para o GitHub.
2. No seu repositório no GitHub, vá na aba **Actions**.
3. Clique no workflow **Build Android APK**.
4. Assim que a build terminar (ícone de check verde), clique nela.
5. Role até o fim da página até a seção **Artifacts**.
6. Clique em **comissionamento-vc-debug** para baixar o arquivo `.zip` contendo o seu APK.

---

## Funcionamento Offline e Sincronização

O sistema foi configurado com os seguintes recursos:

1. **Persistence do Firestore (IndexedDB)**: Todos os dados salvos enquanto você estiver sem internet ficarão guardados no armazenamento local do celular.
2. **Sincronização Automática**: Assim que o aplicativo detectar uma conexão ativa, o Firebase enviará automaticamente as alterações pendentes para a nuvem.
3. **Assets Locais**: Todo o código da interface (HTML/JS/CSS) e imagens locais estão embutidos no APK, garantindo que o app abra instantaneamente mesmo sem sinal.

### Dicas de Teste Offline:
1. Abra o app com internet e faça login.
2. Coloque o celular em **Modo Avião**.
3. Preencha uma nova ficha e salve.
4. Note que a ficha aparecerá na lista como salva localmente.
5. Desative o Modo Avião.
6. Em alguns segundos, os dados serão sincronizados com o servidor Firebase.
