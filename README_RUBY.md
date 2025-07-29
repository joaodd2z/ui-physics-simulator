# 🎭 Sistema de Ragdolls Inteligentes em Ruby

## 📋 Visão Geral

Este projeto implementa um sistema avançado de ragdolls com inteligência artificial em Ruby, incluindo:

- 🤖 **IA Avançada**: Cada ragdoll tem personalidade única, estados emocionais e comportamentos emergentes
- 🏃‍♂️ **Fuga do Mouse**: Ragdolls detectam e fogem do cursor baseado em sua personalidade
- 🤸‍♂️ **Parkour Inteligente**: Sistema de detecção de obstáculos e pulos estratégicos
- 💥 **Sistema de Dano**: Dano realista por impacto com indicadores visuais
- 👥 **Interações Sociais**: Cooperação, conflitos e curiosidade entre ragdolls
- 🌀 **Física Realista**: Simulação de colisões, forças e movimento

## 🚀 Instalação do Ruby

### Windows
1. Baixe o Ruby Installer: https://rubyinstaller.org/
2. Execute o instalador e siga as instruções
3. Abra um novo terminal e verifique: `ruby --version`

### macOS
```bash
# Usando Homebrew
brew install ruby

# Ou usando rbenv
brew install rbenv
rbenv install 3.1.0
rbenv global 3.1.0
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ruby-full
```

## 🎮 Como Executar

```bash
# Navegar para o diretório
cd ui-physics-simulator

# Executar o sistema
ruby ragdoll_system.rb
```

## 📊 Funcionalidades Implementadas

### 🧠 Sistema de IA (Classe RagdollAI)
- **Personalidade**: Valor de 0 (covarde) a 1 (corajoso)
- **Estados Emocionais**: Medo, energia, saúde
- **Estados Comportamentais**: idle, fleeing, fighting, injured, parkour, cooperating, curious, dead
- **Recuperação**: Sistema de cura gradual ao longo do tempo

### 🎭 Ragdoll (Classe Ragdoll)
- **Movimento Inteligente**: Fuga do mouse baseada na personalidade
- **Parkour**: Detecção de obstáculos e pulos estratégicos
- **Interações Sociais**: Baseadas na compatibilidade de personalidades
- **Sistema de Dano**: Ferimentos visuais e estados de saúde

### 🌍 Mundo Físico (Classe PhysicsWorld)
- **Simulação em Tempo Real**: 60 FPS de atualização
- **Detecção de Colisões**: Entre ragdolls e com paredes
- **Gerenciamento de Estado**: Exportação e relatórios detalhados

## 🎯 Exemplo de Uso

```ruby
# Criar mundo físico
world = PhysicsWorld.new

# Adicionar ragdolls
3.times { world.add_ragdoll }

# Adicionar obstáculos
world.add_obstacle(400, 500)

# Simular movimento do mouse
world.update_mouse_position(300, 200)

# Executar um passo da simulação
world.simulate_step

# Relatório de status
world.status_report
```

## 📈 Saída Esperada

```
🌍 Mundo físico inicializado!
🎭 Novo ragdoll criado em (156.0, 234.0) com personalidade 73%
🎭 Novo ragdoll criado em (445.0, 123.0) com personalidade 28%
🎭 Novo ragdoll criado em (678.0, 389.0) com personalidade 91%
✅ Ragdoll adicionado! Total: 3

🏃‍♂️ Ragdoll a1b2c3d4 fugindo! Distância do mouse: 156.7
🤸‍♂️ Ragdoll fazendo parkour! Energia: 80.0
🤝 Ragdolls a1b2c3d4 e e5f6g7h8 cooperando!
💥 Ragdoll ferido! Saúde: 45.2, Medo: 67.8
```

## 🔧 Personalização

### Ajustar Comportamentos
```ruby
# Modificar força de fuga
flee_force = (1 - @ai.personality) * 0.5 + 0.2

# Ajustar cooldown de pulo
can_jump? # 1 segundo de cooldown padrão

# Personalizar compatibilidade
compatibility = @ai.compatibility_with(other_ai)
```

### Estados Personalizados
```ruby
# Adicionar novos estados
STATES = %w[idle fleeing fighting injured parkour cooperating curious dead custom_state].freeze

# Implementar comportamento customizado
def apply_custom_behavior
  case @ai.state
  when 'custom_state'
    # Seu comportamento aqui
  end
end
```

## 🎨 Integração com JavaScript

O sistema Ruby pode ser integrado com o simulador JavaScript através de:

1. **API REST**: Expor endpoints para controlar ragdolls
2. **WebSockets**: Comunicação em tempo real
3. **JSON Export**: Exportar estados para o frontend

```ruby
# Exportar estado para JavaScript
state = world.export_state
File.write('ragdoll_state.json', JSON.pretty_generate(state))
```

## 🚀 Próximos Passos

- [ ] Interface web com Sinatra/Rails
- [ ] Persistência em banco de dados
- [ ] Algoritmos genéticos para evolução de personalidades
- [ ] Rede neural para comportamentos mais complexos
- [ ] Multiplayer em tempo real

## 🤝 Contribuição

Sinta-se à vontade para contribuir com:
- Novos comportamentos de IA
- Otimizações de performance
- Interfaces gráficas
- Documentação adicional

---

**Desenvolvido com ❤️ em Ruby para demonstrar IA comportamental avançada!**