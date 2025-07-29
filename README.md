# 🎮 Simulador de Física UI

Um simulador de física interativo construído com Matter.js, featuring ragdolls inteligentes, sistema de combate e interações realistas.

## ✨ Características

- **Ragdolls Inteligentes**: Personagens com IA que respondem ao ambiente
- **Sistema de Combate**: Mecânicas de dano e interação entre objetos
- **Física Realista**: Powered by Matter.js para simulações precisas
- **Interface Intuitiva**: Controles simples e responsivos
- **Interação com Mouse**: Clique e arraste objetos em tempo real

## 🚀 Como Usar

### Controles Disponíveis:
- 🃏 **Adicionar Carta**: Cria cartas físicas interativas
- ⚽ **Adicionar Bola**: Adiciona bolas que respondem à física
- 🤸 **Adicionar Ragdoll**: Cria personagens com IA e sistema de equilíbrio
- 🏒 **Adicionar Bastão**: Insere bastões para interação
- 🗑️ **Limpar Mundo**: Remove todos os objetos da simulação
- 🌍 **Alternar Gravidade**: Liga/desliga a gravidade

### Interações:
- **Mouse**: Clique e arraste qualquer objeto para movê-lo
- **Ragdolls**: Respondem automaticamente ao movimento e tentam manter equilíbrio
- **Colisões**: Todos os objetos interagem realisticamente entre si

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica e canvas para renderização
- **CSS3**: Design moderno com gradientes e animações
- **JavaScript ES6+**: Lógica de simulação e interatividade
- **Matter.js v0.20.0**: Motor de física 2D de alta performance
- **Responsive Design**: Funciona perfeitamente em desktop e mobile

## 🎯 Atalhos de Teclado

| Tecla | Ação |
|-------|------|
| `C` | Adicionar Card |
| `B` | Adicionar Bolinha |
| `R` | Adicionar Ragdoll |
| `S` | Adicionar Stick |
| `G` | Toggle Gravidade |
| `X` | Limpar Mundo |

## 🚀 Como Executar

### Método 1: Execução Local
```bash
# Clone o repositório
git clone https://github.com/joaodd2z/ui-physics-simulator.git

# Entre na pasta
cd ui-physics-simulator

# Abra o index.html em seu navegador
# Ou use um servidor local:
python -m http.server 8000
# Acesse: http://localhost:8000
```

### Método 2: Deploy no Vercel
```bash
# Instale o Vercel CLI
npm i -g vercel

# Faça deploy
vercel --prod
```

## 🎨 Estrutura do Projeto

```
ui-physics-simulator/
├── index.html          # Página principal
├── css/
│   └── style.css       # Estilos modernos e responsivos
├── js/
│   └── script.js       # Lógica de física e interatividade
└── README.md           # Documentação
```

## 🧠 Como Funciona

### Motor de Física
O simulador utiliza **Matter.js** para criar um mundo físico 2D com:
- **Engine**: Gerencia a simulação física
- **Render**: Renderiza os objetos no canvas
- **Bodies**: Objetos físicos (círculos, retângulos)
- **Constraints**: Articulações para ragdolls
- **Mouse Constraint**: Interação com mouse/touch

### Ragdoll Physics
Os ragdolls são compostos por:
- **6 Partes do Corpo**: Cabeça, torso, braços e pernas
- **5 Articulações**: Pescoço, ombros e quadris
- **Física Responsiva**: Reagem ao movimento do mouse quando próximos

### Sistema de Interação
- **Detecção de Proximidade**: Ragdolls respondem quando o mouse está próximo
- **Aplicação de Força**: Forças suaves aplicadas para movimento natural
- **Drag & Drop**: Sistema completo de arrastar e soltar

## 🎯 Casos de Uso

- **Demonstração de Habilidades**: Showcase de JavaScript avançado
- **Educação**: Ensino de conceitos de física
- **Prototipagem**: Teste de interações de UI inovadoras
- **Entretenimento**: Diversão com física interativa
- **Portfolio**: Projeto impressionante para desenvolvedores

## 🔧 Personalização

### Adicionar Novos Objetos
```javascript
createCustomObject() {
    const customBody = Bodies.polygon(x, y, sides, radius, {
        render: {
            fillStyle: '#yourcolor'
        },
        // suas propriedades físicas
    });
    
    Composite.add(this.world, customBody);
}
```

### Modificar Propriedades Físicas
```javascript
// Alterar gravidade
this.engine.world.gravity.y = 0.5; // Gravidade mais fraca

// Alterar elasticidade
restitution: 0.9 // Mais elástico

// Alterar atrito
friction: 0.1 // Menos atrito
```

## 📱 Responsividade

O simulador é totalmente responsivo e funciona em:
- **Desktop**: Interação com mouse
- **Tablet**: Touch e gestos
- **Mobile**: Interface adaptada para telas pequenas

## 🌟 Próximas Funcionalidades

- [ ] Mais tipos de objetos físicos
- [ ] Sistema de partículas
- [ ] Gravidade variável por zona
- [ ] Salvamento de configurações
- [ ] Modo multiplayer
- [ ] Efeitos sonoros
- [ ] Temas personalizáveis

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**João Lucas de Oliveira**
- GitHub: [@joaodd2z](https://github.com/joaodd2z)
- Email: jl.lucas.oliveira@hotmail.com

---

<div align="center">

**⭐ Se você gostou deste projeto, não esqueça de dar uma estrela!**

*Desenvolvido com ❤️ usando Matter.js*

</div>

## 🔗 Links Úteis

- [Matter.js Documentation](https://brm.io/matter-js/)
- [Canvas API Reference](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Vercel Deployment Guide](https://vercel.com/docs)

---

*© 2025 João Lucas de Oliveira. Todos os direitos reservados.*